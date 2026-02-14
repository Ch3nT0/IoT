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
    const [loadingDevice, setLoadingDevice] = useState(null);
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const socketRef = useRef();

    useEffect(() => {
        const timer = setInterval(() => {
            setClock(new Date().toLocaleString('vi-VN'));
        }, 1000);
        socketRef.current = io(API_BASE);
        socketRef.current.on('updateSensor', (data) => {
            setSensors(data);
            updateChartRealtime(data);
        });

        // 2. Lắng nghe phản hồi từ Hardware hoặc Timeout từ BE
        socketRef.current.on('device_status_update', (data) => {
            console.log("Received device status update:", data);
            const { DeviceID, Status, Action } = data;

            setDevices(prev => {
                let finalStatus;

                if (Status === 'Success') {
                    // TH1: Thành công -> Cập nhật theo Action (ON hoặc OFF)
                    finalStatus = Action;
                } else {
                    // TH2: Thất bại (Timeout) -> Quay về trạng thái ngược lại với lệnh vừa bấm
                    // Nếu định bật (ON) mà lỗi -> quay về OFF. Nếu định tắt (OFF) mà lỗi -> quay về ON.
                    finalStatus = (Action === 'ON') ? 'OFF' : 'ON';
                    alert(`Thiết bị ${DeviceID} không phản hồi!`);
                }

                return {
                    ...prev,
                    [DeviceID]: finalStatus
                };
            });
        });


        fetchInitialData();
        fetchDeviceStatus();
        return () => { clearInterval(timer); socketRef.current.disconnect(); };
    }, []);

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
            console.log(result);
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
            console.log("Device status:", status);
            setDevices(status);
        } catch (e) {
            console.error("Lỗi lấy trạng thái thiết bị", e);
        }
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
        // 1. Chặn bấm liên tục nếu đang xử lý
        if (devices[deviceId] === "Processing") return;

        // 2. Xác định hành động tiếp theo dựa trên trạng thái hiện tại
        const currentStatus = devices[deviceId];
        const nextAction = currentStatus === "ON" ? "OFF" : "ON";

        // 3. Cập nhật UI sang trạng thái "Processing" ngay lập tức để hiện Spinner
        setDevices(prev => ({
            ...prev,
            [deviceId]: "Processing"
        }));

        try {
            const success = await iotService.controlDevice(deviceId, nextAction);

            if (!success) {
                setDevices(prev => ({
                    ...prev,
                    [deviceId]: currentStatus
                }));
                alert("Không thể gửi lệnh tới Server!");
            }
        } catch (error) {
            setDevices(prev => ({ ...prev, [deviceId]: currentStatus }));
            console.error("Lỗi khi điều khiển:", error);
        }
    };

    return (
        <main className="h-screen flex flex-col p-6 overflow-hidden bg-slate-50 gap-4">

            {/* Header: Cố định độ cao */}
            <header className="flex justify-between items-center h-12">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bảng điều khiển</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase">{clock}</p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> LIVE
                </div>
            </header>

            {/* Sensor Cards: Cố định độ cao nhỏ hơn */}
            <div className="grid grid-cols-3 gap-4 h-32">
                <SensorCard title="Nhiệt độ" value={sensors.temp} unit="°C" iconClass="fas fa-thermometer-half" gradient="linear-gradient(135deg, #f97316, #ef4444)" />
                <SensorCard title="Độ ẩm" value={sensors.humi} unit="%" iconClass="fas fa-tint" gradient="linear-gradient(135deg, #38bdf8, #2563eb)" />
                <SensorCard title="Ánh sáng" value={sensors.light} unit="Lx" iconClass="fas fa-sun" isDarkText={true} gradient="linear-gradient(135deg, #f8fafc, #fef08a)" />
            </div>

            {/* Chart Section: Chiếm toàn bộ diện tích còn lại */}
            <div className="flex-grow bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <h3 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-widest">Phân tích dữ liệu</h3>
                <div className="flex-grow relative">
                    {chartData.datasets && chartData.datasets.length > 0 ? (
                        <Line
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false, // Quan trọng để chiếm hết container
                                interaction: { mode: 'index', intersect: false },
                                scales: {
                                    y: { type: 'linear', display: true, position: 'left', ticks: { font: { size: 10 } } },
                                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { size: 10 } } }
                                },
                                plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 } } } }
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">Đang tải...</div>
                    )}
                </div>
            </div>

            {/* Device Buttons: Thu gọn kích thước */}
            <div className="grid grid-cols-3 gap-4 h-32">
                <DeviceButton
                    name="Đèn"
                    iconClass="fas fa-lightbulb"
                    status={devices[1]}
                    activeClass="text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                    onClick={() => toggleDev(1)}
                />
                <DeviceButton
                    name="Quạt"
                    iconClass="fas fa-fan"
                    status={devices[2]}
                    activeClass="text-blue-500 animate-spin"
                    onClick={() => toggleDev(2)}
                />
                <DeviceButton
                    name="Điều hòa"
                    iconClass="fas fa-snowflake"
                    status={devices[3]}
                    activeClass="text-cyan-400"
                    onClick={() => toggleDev(3)}
                />
            </div>
        </main>
    );
};

const DeviceButton = ({ name, iconClass, status, activeClass, onClick }) => {
    const isProcessing = status === "Processing";
    const isActive = status === "ON";

    return (
        <button
            onClick={onClick}
            disabled={isProcessing}
            className={`relative overflow-hidden p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center active:scale-95 h-full w-full
                ${isActive
                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-200'
                    : 'bg-white border-slate-100 shadow-sm text-slate-400 hover:border-blue-200'
                }
            `}
        >
            {/* 1. Phần Processing: Hiệu ứng mờ nhẹ nhàng nhưng chuyên nghiệp */}
            {isProcessing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] transition-all">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="mt-2 text-[9px] font-bold text-blue-600 tracking-tighter">PROCESSING ...</span>
                </div>
            )}

            {/* 2. Phần Icon: Trắng hoàn toàn khi ON, Xám khi OFF */}
            <div className={`transition-transform duration-500 ${isActive ? 'scale-110' : ''}`}>
                <i className={`${iconClass} text-4xl ${isActive ? 'text-white' : 'text-slate-200'}`}></i>
            </div>

            {/* 3. Tên thiết bị: Trắng khi ON để nổi bật trên nền xanh */}
            <h4 className={`mt-3 font-black uppercase tracking-widest text-[10px] transition-colors duration-300 
                ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {name}
            </h4>

            {/* 4. Badge trạng thái nhỏ: Giúp nhận diện cực nhanh */}
            <div className={`mt-2 px-3 py-0.5 rounded-full text-[8px] font-bold transition-all
                ${isActive ? 'bg-blue-400 text-white' : 'bg-slate-100 text-slate-300'}`}>
                {isActive ? 'ON' : 'OFF'}
            </div>
        </button>
    );
};

export default Dashboard;