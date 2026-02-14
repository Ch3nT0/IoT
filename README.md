# 🌐 IoT Real-time Dashboard System

Dự án là một hệ thống Full-stack IoT hoàn chỉnh, cho phép giám sát thông số môi trường và điều khiển thiết bị phần cứng từ xa với độ trễ thấp. Hệ thống được tích hợp cơ chế bảo vệ Timeout chuyên nghiệp và giao diện người dùng hiện đại.

---

## 🏗 Kiến trúc hệ thống (System Architecture)

Hệ thống hoạt động dựa trên mô hình Publish/Subscribe qua giao thức MQTT:
1. **Hardware (ESP8266)**: Thu thập dữ liệu cảm biến và thực thi lệnh điều khiển.
2. **Broker (Mosquitto)**: Trạm trung chuyển tin nhắn MQTT.
3. **Backend (Node.js)**: Xử lý logic, lưu trữ Database MySQL và điều phối dữ liệu qua Socket.io.
4. **Frontend (React)**: Hiển thị dữ liệu trực quan và gửi lệnh điều khiển.



---

## 🚀 Các tính năng nổi bật

### 1. Giám sát thời gian thực (Real-time Monitoring)
* Hiển thị Nhiệt độ, Độ ẩm, Ánh sáng dưới dạng thẻ (Cards) và biểu đồ đường (Line Chart).
* Tự động cập nhật dữ liệu không cần load lại trang nhờ **Socket.io**.

### 2. Điều khiển thiết bị thông minh (Smart Control)
* Cơ chế **Optimistic UI**: Hiển thị trạng thái "Processing" ngay khi người dùng bấm nút.
* **Xác nhận từ phần cứng**: Trạng thái thiết bị chỉ chuyển sang ON/OFF khi nhận được bản tin xác nhận (`device/confirm`) từ ESP8266.

### 3. Cơ chế xử lý Timeout (Safety Mechanism)
* Sử dụng **Global Timer Manager** trong Node.js để quản lý các lệnh điều khiển.
* Nếu sau 2 phút phần cứng không phản hồi, hệ thống tự động đánh dấu `Fail` và cập nhật lại giao diện người dùng để đảm bảo tính đồng bộ.

### 4. Quản lý dữ liệu lịch sử
* Lưu trữ toàn bộ lịch sử cảm biến và nhật ký điều khiển.
* Hỗ trợ tìm kiếm, lọc theo thời gian, thiết bị và trạng thái.
* Phân trang (Pagination) mượt mà cho tập dữ liệu lớn.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ sử dụng |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Chart.js, Socket.io-client |
| **Backend** | Node.js, Express.js, MySQL, MQTT.js, Socket.io |
| **IoT** | ESP8266 (NodeMCU), Cảm biến DHT11, LDR, Thư viện ArduinoJson |
| **Tools** | Mosquitto Broker, Postman, MySQL Workbench |

---

## 📦 Cài đặt dự án

### 1. Yêu cầu hệ thống
* Node.js v16+
* MySQL 8.0+
* Mosquitto MQTT Broker

### 2. Cấu hình Backend
Tạo file `.env` tại thư mục `back_end/`:
```env
PORT=3001
DB_HOST=localhost
DB_USER=your_user
DB_PASS=your_password
DB_NAME=iot_management
MQTT_HOST=localhost
MQTT_USER=manh
MQTT_PASS=14112004
```
### 3. Khởi chạy
```
# Tại thư mục Backend
npm install
npm start

# Tại thư mục Frontend
npm install
npm run dev
```

---
## 📡 Danh sách MQTT Topics & Cấu trúc dữ liệu

Hệ thống sử dụng các Topics dưới đây để điều phối dữ liệu giữa **Hardware**, **Broker** và **Backend**.

| Topic | Hướng dữ liệu | Mô tả | Định dạng JSON (Payload) |
| :--- | :--- | :--- | :--- |
| **`dataSensor`** | ESP8266 ➔ BE | Cập nhật thông số môi trường | `{"temp": 28.5, "humi": 65, "light": 450}` |
| **`device/control`** | BE ➔ ESP8266 | Gửi lệnh điều khiển thiết bị | `{"DeviceID": 1, "Action": "ON"}` |
| **`device/confirm`** | ESP8266 ➔ BE | Xác nhận lệnh thực thi thành công | `{"DeviceID": 1, "Status": "Success", "Action": "ON"}` |
| **`device/init`** | ESP8266 ➔ BE | Báo cáo trạng thái khi khởi động | `{"DeviceID": 1, "Status": "OFF"}` |

---

### 📋 Chi tiết cấu trúc Payload

#### 1. Topic: `dataSensor`
Dùng để vẽ biểu đồ và hiển thị thẻ Dashboard.
* `temp`: Nhiệt độ (°C) - Kiểu số thực (Float).
* `humi`: Độ ẩm (%) - Kiểu số nguyên/thực.
* `light`: Cường độ ánh sáng (Lux) - Kiểu số nguyên.

#### 2. Topic: `device/control` & `device/confirm`
* `DeviceID`: ID của thiết bị trong Database (1: Đèn, 2: Quạt, 3: Điều hòa).
* `Action`: Hành động thực hiện (`ON` hoặc `OFF`).
* `Status`: Trạng thái phản hồi (`Success` hoặc `Fail`).