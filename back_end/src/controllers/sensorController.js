const db = require('../config/db');

exports.getAllData = async (req, res) => {
    try {
        const { range, search, sensor, limit, page } = req.query;
        
        // Mảng chứa các giá trị truyền vào câu lệnh SQL
        let queryParams = [];

        let sql = `
            SELECT ds.ID, s.Name as SensorName, ds.Value, ds.CreateAt 
            FROM DataSensor ds 
            JOIN Sensor s ON ds.SensorID = s.ID 
            WHERE 1=1
        `;

        // 1. Lọc theo khoảng thời gian (Range)
        if (range === '30days') {
            sql += ` AND ds.CreateAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) `;
        }

        // 2. Lọc theo tên Sensor
        if (sensor) {
            sql += ` AND s.Name = ? `;
            queryParams.push(sensor);
        }

        // 3. Xử lý Search (Value hoặc CreateAt)
        if (search) {
            sql += ` AND (ds.Value LIKE ? OR DATE_FORMAT(ds.CreateAt, '%Y-%m-%d %H:%i:%s') LIKE ?) `;
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern);
        }

        // 4. Sắp xếp luôn ưu tiên mới nhất lên đầu
        sql += ` ORDER BY ds.CreateAt DESC `;

        // 5. Xử lý Phân trang HOẶC Lấy số lượng lớn cho Dashboard
        // Nếu có limit và page (thường là từ trang Sensor Data)
        if (limit && page) {
            const parsedLimit = parseInt(limit);
            const offset = (parseInt(page) - 1) * parsedLimit;
            sql += ` LIMIT ? OFFSET ? `;
            queryParams.push(parsedLimit, offset);
        } else {
            // Nếu gọi từ Dashboard (không truyền page/limit), mặc định lấy 60-90 bản ghi
            // để đảm bảo mỗi sensor có đủ ~20-30 điểm dữ liệu vẽ chart mượt.
            sql += ` LIMIT 90 `; 
        }

        const [rows] = await db.query(sql, queryParams);

        // Lấy tổng số bản ghi (chỉ cần khi có phân trang)
        let total = 0;
        if (limit && page) {
            const [totalRows] = await db.query(`SELECT COUNT(*) as total FROM DataSensor`);
            total = totalRows[0].total;
        }

        res.status(200).json({
            total: total || rows.length,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy dữ liệu lịch sử", error: error.message });
    }
};