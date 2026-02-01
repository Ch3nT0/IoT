import React, { useState, useEffect } from 'react';
import { iotService } from '../services/iotService';

const ActionHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        device: '',
        startTime: '',
        endTime: ''
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    useEffect(() => {
        fetchHistory();
    }, [pagination.page, filters.device]); // Fetch lại khi đổi trang hoặc loại thiết bị

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Trong thực tế, bạn sẽ truyền filters vào API
            const res = await iotService.getActionHistory(pagination.page, pagination.limit, filters.search, filters.device);
            setHistory(res.data || []);
            setPagination(prev => ({ ...prev, total: res.total || 0 }));
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    const resetFilters = () => {
        setFilters({ search: '', device: '', startTime: '', endTime: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    return (
        <main className="p-10 flex flex-col min-h-screen">
            <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Lịch sử thiết bị</h2>
                <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest text-[10px]">Nhật ký điều khiển hệ thống chi tiết</p>
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
                                    type="text" 
                                    id="search"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    placeholder="Hành động..." 
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border bg-white outline-none focus:ring-2 ring-blue-500 transition-all text-sm font-semibold" 
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thiết bị</label>
                            <select 
                                id="device"
                                value={filters.device}
                                onChange={handleFilterChange}
                                className="w-full px-4 py-3 rounded-2xl border bg-white outline-none focus:ring-2 ring-blue-500 transition-all text-sm font-bold text-slate-600"
                            >
                                <option value="">Tất cả</option>
                                <option value="Light">Đèn</option>
                                <option value="Fan">Quạt</option>
                                <option value="AC">Điều hòa</option>
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
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b sticky top-0 bg-white">
                                <th className="p-6">ID</th>
                                <th className="p-6">Thiết bị</th>
                                <th className="p-6">Hành động</th>
                                <th className="p-6 text-right">Thời gian</th>
                                <th className="p-6 text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400">Đang tải...</td></tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/40 group transition-all">
                                        <td className="p-6 text-slate-300 font-mono">#{item.id}</td>
                                        <td className="p-6 text-slate-800">{item.deviceName}</td>
                                        <td className="p-6">
                                            <span className={`font-black uppercase text-xs italic tracking-widest ${item.action === 'ON' ? 'text-blue-600' : 'text-red-500'}`}>
                                                {item.action}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right font-mono text-slate-400 group-hover:text-blue-600 tracking-tighter">
                                            {new Date(item.createAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-6 text-right text-green-500 font-bold tracking-tight">Thành công</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-6 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Tổng cộng <span className="text-slate-900">{pagination.total}</span> bản ghi
                    </div>

                    <div className="flex items-center gap-1">
                        <button 
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            className="px-4 h-10 flex items-center rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[10px] uppercase tracking-wider hover:text-blue-600 disabled:opacity-30"
                        >
                            Trước
                        </button>
                        <div className="px-4 h-10 flex items-center rounded-xl bg-blue-600 text-white font-black text-sm">
                            {pagination.page}
                        </div>
                        <button 
                            disabled={pagination.page * pagination.limit >= pagination.total}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            className="px-4 h-10 flex items-center rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[10px] uppercase tracking-wider hover:text-blue-600 disabled:opacity-30"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ActionHistory;