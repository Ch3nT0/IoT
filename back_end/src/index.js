const express = require('express');
const mqtt = require('mqtt');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// 1. Kết nối MySQL
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'chencode24',
    database: 'iot_db'
});

// 2. Kết nối MQTT Broker
const mqttClient = mqtt.connect('mqtt://localhost:1883', {
    username: 'manh',
    password: '14112004'
});

mqttClient.on('connect', () => {
    console.log('Connected to MQTT Broker');
    mqttClient.subscribe('dataSensor');
});

// Lắng nghe dữ liệu từ ESP8266 gửi lên
mqttClient.on('message', (topic, message) => {
    if (topic === 'dataSensor') {
        const data = JSON.parse(message.toString());

        // Lưu Nhiệt độ (ID 1), Độ ẩm (ID 2), Ánh sáng (ID 3)
        const sensorValues = [
            [data.temp, 1],
            [data.humi, 2],
            [data.light, 3]
        ];

        sensorValues.forEach(val => {
            db.query("INSERT INTO DataSensor (Value, SensorID) VALUES (?, ?)", val);
        });
        console.log("Data saved to MySQL");
    }
});

// 3. Tạo API Endpoint để lấy dữ liệu cho Frontend sau này
app.get('/api/sensors', (req, res) => {
    const sql = `
        SELECT ds.Value, s.Name, ds.CreateAt 
        FROM DataSensor ds 
        JOIN Sensor s ON ds.SensorID = s.ID 
        ORDER BY ds.CreateAt DESC LIMIT 20
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server BE đang chạy tại http://localhost:${port}`);
});