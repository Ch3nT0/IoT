require('dotenv').config();
const express = require('express');
const sensorRoutes = require('./routes/sensorRoutes');
const mqttClient = require('./config/mqtt');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Cho phép FE truy cập
});

// Sử dụng Routes
app.use('/api/sensors', sensorRoutes);

mqttClient.on('message', async (topic, message) => {
    if (topic === process.env.MQTT_TOPIC) {
        try {
            const payload = message.toString();
            if (!payload || payload === "") return; // Bỏ qua tin nhắn rỗng

            const data = JSON.parse(payload);
            const { temp, humi, light } = data;

            // KIỂM TRA: Chỉ lưu nếu tất cả giá trị đều hợp lệ (không undefined/null)
            if (temp !== undefined && humi !== undefined && light !== undefined) {
                const queries = [
                    db.query("INSERT INTO DataSensor (Value, SensorID) VALUES (?, 1)", [temp]),
                    db.query("INSERT INTO DataSensor (Value, SensorID) VALUES (?, 2)", [humi]),
                    db.query("INSERT INTO DataSensor (Value, SensorID) VALUES (?, 3)", [light])
                ];

                await Promise.all(queries);
                console.log(`Đã lưu dữ liệu: Temp: ${temp}, Humi: ${humi}, Light: ${light}`);

                io.emit('updateSensor', data); 
                console.log("Đã đẩy data qua Websocket:", data);
            } else {
                console.warn("Nhận dữ liệu thiếu trường, không lưu vào DB:", data);
            }

        } catch (err) {
            console.error("Lỗi định dạng JSON hoặc xử lý MQTT:", err.message);
        }
    }
});

server.listen(PORT, () => {
    console.log(`BE đang chạy tại http://localhost:${PORT}`);
});