const { Server } = require('socket.io');
let io;

module.exports = {
    // Hàm này để khởi tạo Socket lần đầu ở index.js
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: { origin: "*" }
        });
        return io;
    },
    // Hàm này để các file khác (mqtt.js, controller) lấy đối tượng io đã tạo
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io chưa được khởi tạo!");
        }
        return io;
    }
};