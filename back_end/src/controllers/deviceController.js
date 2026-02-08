const db = require('../config/db');

// [GET] /api/history?search=&deviceId=&status=&limit=&page=
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