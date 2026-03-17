const mqtt = require('mqtt');
const db = require('./db'); // Đảm bảo đường dẫn tới file db chuẩn
const { getIO } = require('../socket');
require('dotenv').config();

// Sử dụng global hoặc truyền từ controller vào để quản lý Timer
const timers = global.deviceTimers || {}; 

const options = {
    username: process.env.USER_NAME,
    password: process.env.PASSWORD,
    clean: true,
    connectTimeout: 4000,
};

const mqttClient = mqtt.connect(process.env.MQTT_BROKER, options);

mqttClient.on('connect', () => {
    console.log('--- MQTT Connected ---');
    
    // Subscribe các topic cần thiết
    const topics = [process.env.MQTT_TOPIC, 'device/confirm', 'device/init'];
    
    mqttClient.subscribe(topics, (err) => {
        if (!err) {
            console.log(`Đã subscribe: ${topics.join(', ')}`);
        }
    });
});

mqttClient.on('message', async (topic, message) => {
    const io = getIO();
    const payload = message.toString();
    if (!payload) return;

    try {
        const data = JSON.parse(payload);

        // 1. Xử lý dữ liệu cảm biến (Topic: dataSensor)
        if (topic === process.env.MQTT_TOPIC) {
            const { temp, humi, light } = data;
            if (temp !== undefined && humi !== undefined && light !== undefined) {
                await Promise.all([
                    db.query("INSERT INTO DataSensor (Value, SensorID) VALUES (?, 1)", [temp]),
                    db.query("INSERT INTO DataSensor (Value, SensorID) VALUES (?, 2)", [humi]),
                    db.query("INSERT INTO DataSensor (Value, SensorID) VALUES (?, 3)", [light])
                ]);
                io.emit('updateSensor', {
                    temp,
                    humi,
                    light,
                    time: new Date().toLocaleTimeString('vi-VN')
                });
                console.log(`[SENSOR] T: ${temp}, H: ${humi}, L: ${light}`);
            }
        }

        // 2. Xử lý xác nhận từ Hardware (Topic: device/confirm)
        else if (topic === 'device/confirm') {
            
            const { DeviceID } = data;
            const [rows] = await db.query(
                "SELECT ID FROM ActionHistory WHERE DeviceID = ? AND Status = 'Processing' ORDER BY CreateAt DESC LIMIT 1",
                [DeviceID]
            );

            if (rows.length > 0) {
                const historyId = rows[0].ID;
                if (timers[historyId]) {
                    clearTimeout(timers[historyId]);
                    delete timers[historyId];
                }
                await db.query("UPDATE ActionHistory SET Status = 'Success' WHERE ID = ?", [historyId]);
                io.emit('device_status_update', { 
                    DeviceID: DeviceID,
                    Status: 'Success',
                    Action: data.Action || 'Unknown' // Lấy Action từ payload nếu có, hoặc đặt mặc định
                });
                console.log(`[CONFIRM] Device ${DeviceID} Success`);
            }
        }

        // 3. Xử lý đồng bộ khi Hardware khởi động lại (Topic: device/init)
        else if (topic === 'device/init') {
            console.log("[INIT] Hardware yêu cầu đồng bộ. Đang truy vấn trạng thái thành công gần nhất...");
            
            try {
                // Query lấy Action (ON/OFF) của bản ghi Success gần nhất cho từng DeviceID
                const query = `
                    SELECT t1.DeviceID, t1.Action 
                    FROM ActionHistory t1
                    INNER JOIN (
                        SELECT DeviceID, MAX(CreateAt) as MaxTime
                        FROM ActionHistory
                        WHERE Status = 'Success'
                        GROUP BY DeviceID
                    ) t2 ON t1.DeviceID = t2.DeviceID AND t1.CreateAt = t2.MaxTime
                `;

                const [rows] = await db.query(query);

                if (rows.length > 0) {
                    rows.forEach(device => {
                        const syncData = JSON.stringify({
                            DeviceID: device.DeviceID,
                            Status: device.Action // Lấy giá trị ON/OFF từ cột Action gửi vào key Status cho HW hiểu
                        });
                        mqttClient.publish('device/sync', syncData);
                        console.log(`[SYNC] Khôi phục Device ${device.DeviceID} về trạng thái: ${device.Action}`);
                    });
                } else {
                    console.log("[SYNC] Không tìm thấy dữ liệu Success trong DB.");
                }
            } catch (err) {
                console.error("Lỗi đồng bộ:", err);
            }
        }

    } catch (err) {
        console.error(`[MQTT ERROR] Topic: ${topic} - ${err.message}`);
    }
});

module.exports = mqttClient;