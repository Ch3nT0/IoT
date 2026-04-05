const db = require('../config/db');
const mqttClient = require('../config/mqtt')
const { getIO } = require('../socket');
const timers = global.deviceTimers || {};
const io = getIO();
// [GET] /api/devices?search=&deviceId=&status=&limit=&page=
exports.getAllData = async (req, res) => {
    try {
        const { search, deviceId, status, limit, page } = req.query;
        let queryParams = [];
        let sql = `
            SELECT ah.ID, d.Name as DeviceName, ah.Action, ah.Status, ah.CreateAt 
            FROM ActionHistory ah 
            JOIN Device d ON ah.DeviceID = d.ID 
            WHERE 1=1
        `;

        // 1. Xử lý Search (theo thời gian)
        if (search) {
            sql += ` AND DATE_FORMAT(ah.CreateAt, '%Y-%m-%d %H:%i:%s') LIKE ? `;
            queryParams.push(`%${search}%`);
        }
        // 2. Lọc theo Device
        if (deviceId) {
            sql += ` AND d.ID = ? `;
            queryParams.push(deviceId);
        }
        // 3. Lọc theo Status
        if (status) {
            sql += ` AND ah.Status = ? `;
            queryParams.push(status);
        }

        // 4. Sắp xếp mới nhất lên đầu
        sql += ` ORDER BY ah.CreateAt DESC `;

        // 5. Phân trang
        const parsedLimit = limit ? parseInt(limit) : 10;
        const parsedPage = page ? parseInt(page) : 1;

        if (limit && page) {
            const offset = (parsedPage - 1) * parsedLimit;
            sql += ` LIMIT ? OFFSET ? `;
            queryParams.push(parsedLimit, offset);
        }

        const [rows] = await db.query(sql, queryParams);

        // Lấy tổng số bản ghi
        let total = 0;
        let totalPages = 0;

        let countSql = `
            SELECT COUNT(*) as total 
            FROM ActionHistory ah 
            JOIN Device d ON ah.DeviceID = d.ID 
            WHERE 1=1
        `;
        let countParams = [];

        // Áp dụng cùng bộ lọc cho câu lệnh COUNT
        if (search) {
            countSql += ` AND DATE_FORMAT(ah.CreateAt, '%Y-%m-%d %H:%i:%s') LIKE ? `;
            countParams.push(`%${search}%`);
        }
        if (deviceId) {
            countSql += ` AND d.ID = ? `;
            countParams.push(deviceId);
        }
        if (status) {
            countSql += ` AND ah.Status = ? `;
            countParams.push(status);
        }

        const [totalRows] = await db.query(countSql, countParams);
        total = totalRows[0].total;

        totalPages = Math.ceil(total / parsedLimit);

        res.json({
            data: rows,
            total: total,
            totalPages: totalPages,
            currentPage: parsedPage
        });

    } catch (error) {
        res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};

// [GET] /api/devices/status
exports.getLatestDeviceStatus = async (req, res) => {
    try {
        // Lấy hành động mới nhất của mỗi thiết bị (bất kể Success, Fail hay Processing)
        const sql = `
            SELECT t.DeviceID, t.Action, t.Status
            FROM ActionHistory t
            INNER JOIN (
                SELECT DeviceID, MAX(ID) as MaxID
                FROM ActionHistory
                GROUP BY DeviceID
            ) latest ON t.ID = latest.MaxID
            WHERE t.DeviceID IN (1, 2, 3)
        `;

        const [rows] = await db.query(sql);

        // Map kết quả thành Object trạng thái
        const statusMap = {
            1: "OFF",
            2: "OFF",
            3: "OFF"
        };

        rows.forEach(item => {
            if (item.Status === 'Processing') {
                statusMap[item.DeviceID] = "Processing";
            } else if (item.Status === 'Success') {
                statusMap[item.DeviceID] = item.Action; // "ON" hoặc "OFF"
            } else {
                // Nếu bản ghi cuối là 'Fail', ta giữ nguyên trạng thái trước đó hoặc mặc định là OFF
                statusMap[item.DeviceID] = (item.Action === 'ON') ? 'OFF' : 'ON';
                // (Logic: Nếu định Bật mà Fail thì thực tế nó vẫn đang Tắt)
            }
        });

        res.status(200).json(statusMap);
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};

// [POST] /api/devices/control
exports.controlDevice = async (req, res) => {
    const { DeviceID, Action } = req.body;

    if (!DeviceID || !Action) {
        return res.status(400).json({ message: "Thiếu DeviceID hoặc Action" });
    }

    try {
        // 1. Lưu vào bảng ActionHistory với trạng thái ban đầu là Processing
        const [result] = await db.query(
            `INSERT INTO ActionHistory (DeviceID, Action, Status, CreateAt) 
             VALUES (?, ?, 'Processing', NOW())`,
            [DeviceID, Action]
        );
        const historyId = result.insertId;

        // 2. Gửi lệnh xuống Hardware qua MQTT (JSON format)
        const topic = "device/control";
        const payload = JSON.stringify({ DeviceID, Action });
        mqttClient.publish(topic, payload, { qos: 1 });

        // 3. THIẾT LẬP TIMEOUT 5s
        timers[historyId] = setTimeout(async () => {
            // Kiểm tra lại xem bản ghi vẫn là Processing thì mới đánh Fail
            const [check] = await db.query(
                "SELECT Status FROM ActionHistory WHERE ID = ?", [historyId]
            );

            if (check[0] && check[0].Status === 'Processing') {
                await db.query(
                    "UPDATE ActionHistory SET Status = 'Fail' WHERE ID = ?", [historyId]
                );

                // Gửi thông báo qua Socket.io để UI React cập nhật ngay lập tức
                io.emit('device_status_update', {
                    DeviceID: DeviceID,
                    Status: 'Fail',
                    Action: Action,    // Lệnh mà người dùng đã bấm (ví dụ "ON")
                    Message: 'Timeout'
                });

                console.log(`[TIMEOUT] HistoryID ${historyId} đánh dấu Fail.`);
            }
            delete timers[historyId]; // Xóa khỏi bộ nhớ
        }, 5000);

        res.status(200).json({
            message: "Lệnh đã được gửi, đang chờ phản hồi...",
            historyId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};