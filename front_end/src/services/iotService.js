const API_BASE = "http://localhost:3001";

export const iotService = {
    // 1. Hàm tổng hợp cho Sensor Data (Dùng cho cả Dashboard và trang Sensor Data)
    getAllSensors: async (params = {}) => {
        try {
            const { page, limit, search, range, sensor } = params;
            
            // Chỉ thêm các tham số thực sự tồn tại vào URLSearchParams
            const queryObj = {};
            if (page) queryObj.page = page;
            if (limit) queryObj.limit = limit;
            if (search) queryObj.search = search;
            if (range) queryObj.range = range;
            if (sensor) queryObj.sensor = sensor;

            const queryString = new URLSearchParams(queryObj).toString();
            
            const res = await fetch(`${API_BASE}/api/sensors?${queryString}`);
            if (!res.ok) throw new Error("Lỗi tải dữ liệu cảm biến");
            return await res.json();
        } catch (error) {
            console.error("Error in getAllSensors:", error);
            throw error;
        }
    },

    // 2. Lấy lịch sử điều khiển thiết bị
    getActionHistory: async (page = 1, limit = 10, search = '', deviceId = '', status = '') => {
        try {
            const query = new URLSearchParams({ 
                page, 
                limit, 
                ...(search && { search }), 
                ...(deviceId && { deviceId }) ,
                ...(status && { status })
            }).toString();
            console.log(query);
            const res = await fetch(`${API_BASE}/api/devices?${query}`);
            if (!res.ok) throw new Error("Lỗi tải lịch sử");
            return await res.json();
        } catch (error) {
            console.error("Error in getActionHistory:", error);
            throw error;
        }
    },

    // 3. Điều khiển thiết bị (Bật/Tắt)
    controlDevice: async (DeviceID, Action) => {
        try {
            const res = await fetch(`${API_BASE}/api/devices/control`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ DeviceID, Action })
            });
            return res.ok;
        } catch (error) {
            console.error("Error controlling device:", error);
            return false;
        }
    },

    getStatusDevices: async () => {
        try {
            const res = await fetch(`${API_BASE}/api/devices/status`);
            if (!res.ok) throw new Error("Lỗi tải trạng thái thiết bị");
            return await res.json();
        } catch (error) {
            console.error("Error in getStatusDevice:", error);
            throw error;
        }
    }
};