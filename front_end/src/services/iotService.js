const API_BASE = "http://localhost:3001";

export const iotService = {
    // Lấy dữ liệu cảm biến ban đầu
    getSensorHistory: async (range = '30days') => {
        try {
            const res = await fetch(`${API_BASE}/api/sensors?range=${range}`);
            if (!res.ok) throw new Error("Network response was not ok");
            return await res.json();
        } catch (error) {
            console.error("Error fetching sensor data:", error);
            throw error;
        }
    },

    // Điều khiển thiết bị (Bật/Tắt)
    controlDevice: async (deviceName, action) => {
        try {
            const res = await fetch(`${API_BASE}/api/sensors/control`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceName, action })
            });
            return res.ok;
        } catch (error) {
            console.error("Error controlling device:", error);
            return false;
        }
    },

    getActionHistory: async (page = 1, limit = 10, search = '', device = '') => {
        try {
            const query = `?page=${page}&limit=${limit}&search=${search}&device=${device}`;
            const res = await fetch(`${API_BASE}/api/history${query}`);
            if (!res.ok) throw new Error("Lỗi tải lịch sử");
            return await res.json();
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    },

    getAllSensors: async (params) => {
        const { page, limit, search, type, startTime, endTime } = params;
        try {
            // Xây dựng query string dựa trên các filter có sẵn
            const query = new URLSearchParams({
                page, limit,
                ...(search && { search }),
                ...(type && { type }),
                ...(startTime && { startTime }),
                ...(endTime && { endTime })
            }).toString();

            const res = await fetch(`${API_BASE}/api/sensors/all?${query}`);
            if (!res.ok) throw new Error("Lỗi tải dữ liệu cảm biến");
            return await res.json();
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

};