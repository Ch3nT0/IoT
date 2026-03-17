require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import logic Socket và các module khác
const socketStorage = require('./socket'); 
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// 1. KHỞI TẠO SOCKET.IO
socketStorage.init(server); 

// 2. IMPORT MQTT VÀ ROUTES 
// (Phải sau khi khởi tạo socket để tránh lỗi undefined io)
const mqttClient = require('./config/mqtt');
const sensorRoutes = require('./routes/sensorRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

// Đăng ký Routes API
app.use('/api/sensors', sensorRoutes);
app.use('/api/devices', deviceRoutes);

// 3. CẤU HÌNH SWAGGER (OPENAPI)
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'IoT Dashboard API',
            version: '1.0.0',
            description: 'PTIT IoT Project API Documentation',
        },
        // Quan trọng: Khởi tạo sẵn các object này
        paths: {},
        components: {},
    },
    // Trỏ thẳng và chính xác vào thư mục routes
    apis: [path.join(__dirname, './routes/*.js')],
};

try {
    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    const pathsCount = Object.keys(swaggerSpec?.paths || {}).length;

    // Luon mount Swagger UI de de debug, ke ca khi chua parse duoc endpoint.
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec || swaggerOptions.definition));
    console.log(`Swagger UI: http://localhost:${process.env.PORT || 3001}/api-docs`);
    console.log(`[Swagger] Tim thay ${pathsCount} endpoint tu comment @swagger`);
} catch (error) {
    // Nếu vẫn lỗi, Server sẽ không bị Crash mà chỉ in ra log
    console.error("Lỗi cấu hình Swagger:", error.message);
}

// 4. KHỞI CHẠY SERVER
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Backend đang chạy tại: http://localhost:${PORT}`);
});