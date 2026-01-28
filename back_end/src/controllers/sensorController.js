const db = require('../config/db');

// [GET] api/sensor/history?range=30days
exports.getAllData = async (req, res) => {
    try {
        const range = req.query.range;
        let sql = `
            SELECT ds.ID, s.Name as SensorName, ds.Value, ds.CreateAt 
            FROM DataSensor ds 
            JOIN Sensor s ON ds.SensorID = s.ID 
        `;

        if (range === '30days') {
            sql += ` WHERE ds.CreateAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) `;
        }

        sql += ` ORDER BY ds.CreateAt DESC `;

        const [rows] = await db.query(sql);

        res.status(200).json({
            count: rows.length,
            data: rows
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy dữ liệu lịch sử", error: error.message });
    }
};
