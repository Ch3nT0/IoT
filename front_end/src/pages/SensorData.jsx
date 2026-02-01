import React, { useState, useEffect } from 'react';
import { iotService } from '../services/iotService';

const SensorData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        startTime: '',
        endTime: ''
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    useEffect(() => {
        fetchData();
    }, [pagination.page, filters.type]); // Fetch lại khi đổi trang hoặc loại cảm biến

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await iotService.getAllSensors({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });
            setData(res.data || []);
            setPagination(prev => ({ ...prev, total: res.total || 0 }));
        } catch (e) {
            console.error("Lỗi fetch data", e);
        }
        setLoading(false);
    };

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    const resetFilters = () => {
        setFilters({ search: '', type: '', startTime: '', endTime: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const getUnit = (type) => {
        if (type.includes('Nhiệt độ') || type === 'Temperature') return '°C';
        if (type.includes('Độ ẩm') || type === 'Humidity') return '%';
        if (type.includes('Ánh sáng') || type === 'Light') return 'Lx';
        return '';
    };

    const getColorClass = (type) => {
        if (type.includes('Nhiệt độ')) return 'text-orange-600';
        if (type.includes('Độ ẩm')) return 'text-blue-600';
        if (type.includes('Ánh sáng')) return 'text-yellow-600';
        return 'text-slate-800';
    };

    return (
        <main className="flex-grow p-10 flex flex-col">
            <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dữ liệu Cảm biến</h2>
                <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest text-[10px]">Lọc & Tra cứu theo Loại và Thời gian</p>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* Filter Header */}
                <div className="p-8 bg-slate-50 border-b">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                        <div className="lg:col-span-3 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tìm kiếm nhanh</label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-4 top-3.5 text-slate-300"></i>
                                <input 
                                    type="text" id="search" value={filters.search} onChange={handleFilterChange}
                                    placeholder="ID hoặc giá trị..." 
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border bg-white outline-none focus:ring-2 ring-blue-500 transition-all text-sm font-semibold" 
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại cảm biến</label>
                            <select 
                                id="type" value={filters.type} onChange={handleFilterChange}
                                className="w-full px-4 py-3 rounded-2xl border bg-white outline-none focus:ring-2 ring-blue-500 transition-all text-sm font-bold text-slate-600"
                            >
                                <option value="">Tất cả</option>
                                <option value="Temperature">Nhiệt độ</option>
                                <option value="Humidity">Độ ẩm</option>
                                <option value="Light">Ánh sáng</option>
                            </select>
                        </div>

                        <div className="lg:col-span-5 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khoảng thời gian</label>
                            <div className="flex items-center gap-2">
                                <input type="datetime-local" id="startTime" value={filters.startTime} onChange={handleFilterChange} className="w-full px-3 py-3 rounded-2xl border bg-white focus:ring-2 ring-blue-500 outline-none transition-all font-mono text-[10px] uppercase" />
                                <span className="text-slate-300 font-bold">→</span>
                                <input type="datetime-local" id="endTime" value={filters.endTime} onChange={handleFilterChange} className="w-full px-3 py-3 rounded-2xl border bg-white focus:ring-2 ring-blue-500 outline-none transition-all font-mono text-[10px] uppercase" />
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <button onClick={resetFilters} className="w-full h-[46px] bg-slate-200 text-slate-600 rounded-2xl font-black hover:bg-red-50 hover:text-red-600 transition-all text-[10px] uppercase tracking-widest">
                                Xóa lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="max-h-[calc(100vh-450px)] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b sticky top-0 bg-white z-10">
                                <th className="p-6">ID <i className="fas fa-sort ml-1 opacity-20"></i></th>
                                <th className="p-6">Loại Cảm biến</th>
                                <th className="p-6">Giá trị</th>
                                <th className="p-6 text-right">Thời gian (H:M:S)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                            {loading ? (
                                <tr><td colSpan="4" className="p-10 text-center">Đang tải dữ liệu...</td></tr>
                            ) : data.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/40 group">
                                    <td className="p-6 text-slate-300 font-mono">#{item.id}</td>
                                    <td className="p-6 text-slate-800">{item.sensorType}</td>
                                    <td className={`p-6 font-black text-xl ${getColorClass(item.sensorType)}`}>
                                        {item.value} <small className="text-slate-300 font-normal">{getUnit(item.sensorType)}</small>
                                    </td>
                                    <td className="p-6 text-right font-mono text-slate-400 group-hover:text-blue-600 tracking-tighter italic">
                                        {new Date(item.createAt).toLocaleString('vi-VN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-6 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Hiển thị <span className="text-slate-900">{(pagination.page-1)*pagination.limit + 1} - {Math.min(pagination.page*pagination.limit, pagination.total)}</span> / {pagination.total} bản ghi
                    </div>

                    <div className="flex items-center gap-1">
                        <button 
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(p => ({...p, page: p.page - 1}))}
                            className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[10px] uppercase hover:text-blue-600 disabled:opacity-30"
                        >Trước</button>
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white font-black">{pagination.page}</div>
                        <button 
                            disabled={pagination.page * pagination.limit >= pagination.total}
                            onClick={() => setPagination(p => ({...p, page: p.page + 1}))}
                            className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[10px] uppercase hover:text-blue-600 disabled:opacity-30"
                        >Sau</button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SensorData;