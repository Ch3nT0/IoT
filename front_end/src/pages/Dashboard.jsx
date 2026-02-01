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
    const [devices, setDevices] = useState({ light: false, fan: false, ac: false });
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

        fetchInitialData();

        return () => {
            clearInterval(timer);
            socketRef.current.disconnect();
        };
    }, []);

    // Định nghĩa logic xử lý dữ liệu cho Chart
    const processChartData = (list) => {
        const temps = list.filter(s => s.SensorName === 'Temperature').slice(0, 30).reverse();
        const humis = list.filter(s => s.SensorName === 'Humidity').slice(0, 30).reverse();
        const lights = list.filter(s => s.SensorName === 'Light').slice(0, 30).reverse();

        setChartData({
            labels: temps.map(d => new Date(d.CreateAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
            datasets: [
                { 
                    label: 'Nhiệt độ (°C)', 
                    data: temps.map(d => d.Value), 
                    borderColor: '#ef4444', 
                    tension: 0.4, 
                    yAxisID: 'y', 
                    fill: true, 
                    backgroundColor: 'rgba(239, 68, 68, 0.05)' 
                },
                { 
                    label: 'Độ ẩm (%)', 
                    data: humis.map(d => d.Value), 
                    borderColor: '#3b82f6', 
                    tension: 0.4, 
                    yAxisID: 'y', 
                    fill: true, 
                    backgroundColor: 'rgba(59, 130, 246, 0.05)' 
                },
                { 
                    label: 'Ánh sáng (Lx)', 
                    data: lights.map(d => d.Value), 
                    borderColor: '#f59e0b', 
                    tension: 0.4, 
                    yAxisID: 'y1', 
                    fill: true, 
                    backgroundColor: 'rgba(245, 158, 11, 0.05)' 
                }
            ]
        });
    };

    const fetchInitialData = async () => {
        try {
            const result = await iotService.getSensorHistory('30days');
            const list = result.data || [];

            if (list.length > 0) {
                processChartData(list);

                // Lấy giá trị mới nhất để hiển thị lên thẻ SensorCard
                const latestTemp = list.find(s => s.SensorName === 'Temperature')?.Value || 0;
                const latestHumi = list.find(s => s.SensorName === 'Humidity')?.Value || 0;
                const latestLight = list.find(s => s.SensorName === 'Light')?.Value || 0;

                setSensors({ temp: latestTemp, humi: latestHumi, light: latestLight });
            }
        } catch (e) {
            console.error("Failed to load initial data", e);
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

    const toggleDev = async (dev) => {
        setLoadingDevice(dev);
        const action = !devices[dev] ? "ON" : "OFF";
        const success = await iotService.controlDevice(dev, action);

        if (success) {
            setDevices(prev => ({ ...prev, [dev]: !prev[dev] }));
        } else {
            alert("Lỗi kết nối server!");
        }
        setLoadingDevice(null);
    };

    return (
        <main className="p-10">
            {/* ... JSX Header và SensorCard giữ nguyên như cũ ... */}
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Bảng điều khiển</h1>
                    <p className="text-slate-500 font-medium">{clock}</p>
                </div>
                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Real-time Live
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SensorCard
                    title="Nhiệt độ"
                    value={sensors.temp}
                    unit="°C"
                    iconClass="fas fa-thermometer-half"
                    gradient="linear-gradient(135deg, #f97316, #ef4444)"
                />
                <SensorCard
                    title="Độ ẩm"
                    value={sensors.humi}
                    unit="%"
                    iconClass="fas fa-tint"
                    gradient="linear-gradient(135deg, #38bdf8, #2563eb)"
                />
                <SensorCard
                    title="Ánh sáng"
                    value={sensors.light}
                    unit="Lx"
                    iconClass="fas fa-sun"
                    isDarkText={true}
                    gradient="linear-gradient(135deg, #f8fafc, #fef08a)"
                />
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Phân tích dữ liệu tổng hợp</h3>
                <div className="h-[400px]">
                    {chartData.datasets && chartData.datasets.length > 0 ? (
                        <Line
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: { mode: 'index', intersect: false },
                                scales: {
                                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Temp/Humi' } },
                                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Light (Lx)' } }
                                }
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                           <i className="fas fa-circle-notch animate-spin mr-2"></i> Đang tải dữ liệu biểu đồ...
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <DeviceButton
                    name="ĐÈN LED"
                    iconClass="fas fa-lightbulb"
                    active={devices.light}
                    loading={loadingDevice === 'light'}
                    activeClass="text-yellow-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]"
                    onClick={() => toggleDev('light')}
                />
                <DeviceButton
                    name="QUẠT GIÓ"
                    iconClass="fas fa-fan"
                    active={devices.fan}
                    loading={loadingDevice === 'fan'}
                    activeClass="text-blue-500 animate-spin"
                    onClick={() => toggleDev('fan')}
                />
                <DeviceButton
                    name="ĐIỀU HÒA"
                    iconClass="fas fa-snowflake"
                    active={devices.ac}
                    loading={loadingDevice === 'ac'}
                    activeClass="text-cyan-400"
                    onClick={() => toggleDev('ac')}
                />
            </div>
        </main>
    );
};

const DeviceButton = ({ name, iconClass, active, loading, activeClass, onClick }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className={`relative overflow-hidden bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center transition-all hover:shadow-md active:scale-95 ${active ? 'bg-slate-50' : ''}`}
    >
        {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                <div className="w-8 h-8 border-4 border-slate-200 border-b-blue-600 rounded-full animate-spin"></div>
            </div>
        )}
        <i className={`${iconClass} text-6xl transition-all duration-500 ${active ? activeClass : 'text-slate-200'}`}></i>
        <h4 className="mt-6 font-extrabold text-slate-600 uppercase tracking-wider">{name}</h4>
    </button>
);

export default Dashboard;