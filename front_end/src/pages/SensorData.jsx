import React, { useState, useEffect } from 'react';
import { iotService } from '../services/iotService';

const SensorData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', sensor: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0 });

    useEffect(() => {
        fetchData();
    }, [pagination.page, filters.sensor]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await iotService.getAllSensors({
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search,
                sensor: filters.sensor,
            });
            setData(res.data || []);
            setPagination(prev => ({ ...prev, total: res.total || 0 }));
        } catch (e) {
            console.error("Lỗi fetch data:", e);
        }
        setLoading(false);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "--";
        const date = new Date(dateString);
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const getMeta = (name) => {
        const map = {
            'Temperature': { unit: '°C', color: 'text-orange-600', icon: 'fa-thermometer-half' },
            'Humidity': { unit: '%', color: 'text-blue-600', icon: 'fa-tint' },
            'Light': { unit: 'Lx', color: 'text-yellow-500', icon: 'fa-sun' }
        };
        return map[name] || { unit: '', color: 'text-slate-800', icon: 'fa-database' };
    };

    return (
        <main className="h-screen flex flex-col p-6 overflow-hidden bg-slate-50 gap-4">
            
            {/* Header đồng bộ Dashboard */}
            <header className="flex justify-between items-center h-12">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dữ liệu Cảm biến</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tra cứu lịch sử thông số</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                        Làm mới
                    </button>
                </div>
            </header>

            {/* Khối Filter Area */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-4 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tìm kiếm nhanh</label>
                        <input 
                            type="text" 
                            id="search" 
                            value={filters.search} 
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            placeholder="Giá trị hoặc thời gian..." 
                            className="w-full px-4 py-2.5 rounded-2xl border bg-slate-50 outline-none focus:ring-2 ring-blue-500 text-xs font-semibold transition-all" 
                        />
                    </div>
                    <div className="col-span-3 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cảm biến</label>
                        <select 
                            id="sensor" 
                            value={filters.sensor} 
                            onChange={(e) => setFilters({...filters, sensor: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-2xl border bg-slate-50 outline-none focus:ring-2 ring-blue-500 text-xs font-bold text-slate-600"
                        >
                            <option value="">Tất cả</option>
                            <option value="Temperature">Nhiệt độ</option>
                            <option value="Humidity">Độ ẩm</option>
                            <option value="Light">Ánh sáng</option>
                        </select>
                    </div>
                    <div className="col-span-5 flex gap-2">
                        <button onClick={() => { setPagination(p => ({...p, page: 1})); fetchData(); }} className="flex-grow py-2.5 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                            Áp dụng lọc
                        </button>
                        <button onClick={() => setFilters({search:'', sensor:''})} className="px-6 py-2.5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all">
                            Xóa
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section: Chiếm diện tích còn lại, có scroll nội bộ */}
            <div className="flex-grow bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b">
                                <th className="p-5 px-8">ID</th>
                                <th className="p-5 px-8">Tên Cảm biến</th>
                                <th className="p-5 text-center">Giá trị đo</th>
                                <th className="p-5 px-8 text-right">Thời gian ghi nhận</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[13px] font-bold text-slate-600">
                            {loading ? (
                                <tr><td colSpan="4" className="p-20 text-center"><i className="fas fa-spinner animate-spin text-blue-600 text-2xl"></i></td></tr>
                            ) : data.length > 0 ? (
                                data.map((item) => {
                                    const meta = getMeta(item.SensorName);
                                    return (
                                        <tr key={item.ID} className="hover:bg-blue-50/40 group transition-colors">
                                            <td className="p-4 px-8 text-slate-300 font-mono text-[11px]">#{item.ID}</td>
                                            <td className="p-4 px-8 text-slate-800 flex items-center gap-2">
                                                <i className={`fas ${meta.icon} opacity-20 text-xs`}></i> {item.SensorName}
                                            </td>
                                            <td className={`p-4 text-center text-lg font-black ${meta.color}`}>
                                                {item.Value} <span className="text-slate-300 font-normal text-xs">{meta.unit}</span>
                                            </td>
                                            <td className="p-4 px-8 text-right font-mono text-slate-400 group-hover:text-blue-600 tracking-tighter italic text-[11px]">
                                                {formatDateTime(item.CreateAt)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="4" className="p-20 text-center text-slate-400 uppercase text-[10px] font-bold">Không có dữ liệu</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer: Cố định bên dưới khối bảng */}
                <div className="p-4 bg-slate-50/50 border-t flex justify-between items-center h-16">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                        Tổng: <span className="text-blue-600">{pagination.total}</span> bản ghi
                    </span>
                    <div className="flex items-center gap-1 mr-4">
                        <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({...p, page: p.page - 1}))} className="px-4 h-9 rounded-xl bg-white border text-[10px] font-black uppercase hover:bg-slate-100 disabled:opacity-30 transition-all">Trước</button>
                        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-100">{pagination.page}</div>
                        <button disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => setPagination(p => ({...p, page: p.page + 1}))} className="px-4 h-9 rounded-xl bg-white border text-[10px] font-black uppercase hover:bg-slate-100 disabled:opacity-30 transition-all">Sau</button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SensorData;