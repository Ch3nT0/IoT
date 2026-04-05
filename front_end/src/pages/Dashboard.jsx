import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import SensorCard from '../components/SensorCard';
import { iotService } from '../services/iotService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_BASE = "http://localhost:3001";

const Dashboard = () => {
    const [clock, setClock] = useState('--:--:--');
    const [sensors, setSensors] = useState({ temp: 0, humi: 0, light: 0 });
    const [devices, setDevices] = useState({ 1: "OFF", 2: "OFF", 3: "OFF" });
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    
    // --- KHU VỰC QUẢN LÝ TRẠNG THÁI ONLINE/OFFLINE ---
    const [isOnline, setIsOnline] = useState(true);
    const socketRef = useRef();
    const offlineTimerRef = useRef(null); // Timer để theo dõi "nhịp đập" 2s

    useEffect(() => {
        // 1. Đồng hồ thời gian thực
        const timer = setInterval(() => {
            setClock(new Date().toLocaleString('vi-VN'));
        }, 1000);
        offlineTimerRef.current = setTimeout(() => {
            setIsOnline(false);
        }, 3000);

        // 2. Kết nối Socket.io
        socketRef.current = io(API_BASE);

        // Lắng nghe dữ liệu cảm biến (Heartbeat chính)
        socketRef.current.on('updateSensor', (data) => {
            setSensors(data);
            updateChartRealtime(data);

            // MỖI KHI CÓ DATA: Chuyển sang Online ngay
            setIsOnline(true);

            // Xóa bộ đếm cũ và lập bộ đếm mới 2.5 giây
            if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
            
            offlineTimerRef.current = setTimeout(() => {
                setIsOnline(false); // Nếu quá 2.5s không nhận được tin nhắn mới từ BE -> OFF
            }, 2500); 
        });

        // Lắng nghe phản hồi điều khiển thiết bị
        socketRef.current.on('device_status_update', (data) => {
            const { DeviceID, Status, Action } = data;
            setDevices(prev => {
                let finalStatus;
                if (Status === 'Success') {
                    finalStatus = Action;
                } else {
                    finalStatus = (Action === 'ON') ? 'OFF' : 'ON';
                    alert(`Thiết bị ${DeviceID} không phản hồi!`);
                }
                return { ...prev, [DeviceID]: finalStatus };
            });
        });

        fetchInitialData();
        fetchDeviceStatus();

        return () => { 
            clearInterval(timer); 
            if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
            socketRef.current.disconnect(); 
        };
    }, []);

    // --- CÁC HÀM XỬ LÝ DỮ LIỆU ---
    const processChartData = (list) => {
        const temps = list.filter(s => s.SensorName === 'Temperature').slice(0, 30).reverse();
        const humis = list.filter(s => s.SensorName === 'Humidity').slice(0, 30).reverse();
        const lights = list.filter(s => s.SensorName === 'Light').slice(0, 30).reverse();

        setChartData({
            labels: temps.map(d => new Date(d.CreateAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
            datasets: [
                { label: 'Nhiệt độ (°C)', data: temps.map(d => d.Value), borderColor: '#ef4444', tension: 0.4, yAxisID: 'y', fill: true, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
                { label: 'Độ ẩm (%)', data: humis.map(d => d.Value), borderColor: '#3b82f6', tension: 0.4, yAxisID: 'y', fill: true, backgroundColor: 'rgba(59, 130, 246, 0.05)' },
                { label: 'Ánh sáng (Lx)', data: lights.map(d => d.Value), borderColor: '#f59e0b', tension: 0.4, yAxisID: 'y1', fill: true, backgroundColor: 'rgba(245, 158, 11, 0.05)' }
            ]
        });
    };

    const fetchInitialData = async () => {
        try {
            const result = await iotService.getAllSensors({ range: '30days' });
            const list = result.data || [];
            if (list.length > 0) {
                processChartData(list);
                const latestTemp = list.find(s => s.SensorName === 'Temperature')?.Value || 0;
                const latestHumi = list.find(s => s.SensorName === 'Humidity')?.Value || 0;
                const latestLight = list.find(s => s.SensorName === 'Light')?.Value || 0;
                setSensors({ temp: latestTemp, humi: latestHumi, light: latestLight });
            }
        } catch (e) { console.error("Failed to load initial data", e); }
    };

    const fetchDeviceStatus = async () => {
        try {
            const status = await iotService.getStatusDevices();
            setDevices(status);
        } catch (e) { console.error("Lỗi lấy trạng thái thiết bị", e); }
    };

    const updateChartRealtime = (data) => {
        setChartData(prev => {
            if (!prev.labels || prev.labels.length === 0) return prev;
            const newLabels = [...prev.labels, new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })].slice(-30);
            return {
                ...prev,
                labels: newLabels,
                datasets: prev.datasets.map((ds, i) => {
                    const val = i === 0 ? data.temp : i === 1 ? data.humi : data.light;
                    return { ...ds, data: [...ds.data, val].slice(-30) };
                })
            };
        });
    };

    const toggleDev = async (deviceId) => {
        if (devices[deviceId] === "Processing") return;
        const currentStatus = devices[deviceId];
        const nextAction = currentStatus === "ON" ? "OFF" : "ON";
        setDevices(prev => ({ ...prev, [deviceId]: "Processing" }));

        try {
            const success = await iotService.controlDevice(deviceId, nextAction);
            if (!success) {
                setDevices(prev => ({ ...prev, [deviceId]: currentStatus }));
                alert("Không thể gửi lệnh tới Server!");
            }
        } catch (error) {
            setDevices(prev => ({ ...prev, [deviceId]: currentStatus }));
        }
    };

    return (
        <main className="min-h-screen h-screen flex flex-col p-4 md:p-6 bg-slate-50 gap-4 overflow-hidden">
            {/* Header: Hiển thị trạng thái LIVE/OFFLINE tổng quát */}
            <header className="flex-none flex justify-between items-center h-12">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bảng điều khiển</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{clock}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2 transition-all duration-500 ${isOnline ? 'bg-green-100 text-green-700 shadow-sm shadow-green-100' : 'bg-red-100 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
                    {isOnline ? 'LIVE' : 'OFFLINE'}
                </div>
            </header>

            {/* Sensor Cards: Mỗi card sẽ hiện 'OFF' nếu isOnline = false */}
            <div className="flex-none grid grid-cols-3 gap-4 h-32">
                <SensorCard 
                    title="Nhiệt độ" value={isOnline ? sensors.temp : 'OFF'} unit="°C" 
                    iconClass="fas fa-thermometer-half" isOffline={!isOnline} 
                />
                <SensorCard 
                    title="Độ ẩm" value={isOnline ? sensors.humi : 'OFF'} unit="%" 
                    iconClass="fas fa-tint" isOffline={!isOnline} 
                />
                <SensorCard 
                    title="Ánh sáng" value={isOnline ? sensors.light : 'OFF'} unit="Lx" 
                    iconClass="fas fa-sun" isOffline={!isOnline} 
                />
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-0 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Phân tích dữ liệu</h3>
                    {!isOnline && <span className="text-[10px] font-bold text-red-500 animate-pulse uppercase">Dữ liệu đang tạm ngừng...</span>}
                </div>
                <div className="flex-1 relative w-full">
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: { ticks: { font: { size: 9 } } },
                                y: { ticks: { font: { size: 9 } } },
                                y1: { type: 'linear', display: true, position: 'right', grid: { display: false }, ticks: { font: { size: 9 } } }
                            },
                            plugins: { legend: { display: false } }
                        }}
                    />
                </div>
            </div>

            {/* Device Buttons */}
            <div className="flex-none grid grid-cols-3 gap-4 h-32 mb-2">
                <DeviceButton name="Đèn" iconClass="fas fa-lightbulb" status={devices[1]} onClick={() => toggleDev(1)} />
                <DeviceButton name="Quạt" iconClass="fas fa-fan" status={devices[2]} onClick={() => toggleDev(2)} />
                <DeviceButton name="Điều hòa" iconClass="fas fa-snowflake" status={devices[3]} onClick={() => toggleDev(3)} />
            </div>
        </main>
    );
};

// Component con DeviceButton
const DeviceButton = ({ name, iconClass, status, onClick }) => {
    const isProcessing = status === "Processing";
    const isActive = status === "ON";
    return (
        <button
            onClick={onClick} disabled={isProcessing}
            className={`relative overflow-hidden p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center h-full w-full
                ${isActive ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-400'}
            `}
        >
            {isProcessing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px]">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            )}
            <i className={`${iconClass} text-4xl ${isActive ? 'text-white' : 'text-slate-200'}`}></i>
            <h4 className={`mt-3 font-black uppercase text-[10px] ${isActive ? 'text-white' : 'text-slate-400'}`}>{name}</h4>
            <div className={`mt-2 px-3 py-0.5 rounded-full text-[8px] font-bold ${isActive ? 'bg-blue-400 text-white' : 'bg-slate-100'}`}>
                {isActive ? 'ON' : 'OFF'}
            </div>
        </button>
    );
};

export default Dashboard;