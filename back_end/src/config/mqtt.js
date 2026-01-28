const mqtt = require('mqtt');
require('dotenv').config();

const options = {
    username: process.env.USER_NAME,
    password: process.env.PASSWORD,
    clean: true,
    connectTimeout: 4000,
};

const mqttClient = mqtt.connect(process.env.MQTT_BROKER, options);

mqttClient.on('connect', () => {
    console.log('Đã kết nối thành công tới MQTT Broker');
    mqttClient.subscribe(process.env.MQTT_TOPIC, (err) => {
        if (!err) {
            console.log(`Đã subscribe topic: ${process.env.MQTT_TOPIC}`);
        }
    });
});

mqttClient.on('error', (err) => {
    console.error('Lỗi kết nối MQTT:', err);
});

module.exports = mqttClient;