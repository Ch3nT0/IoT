import React, { useState, useEffect } from 'react';
import { iotService } from '../services/iotService';
import Pagination from '../components/Pagination';

const ActionHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ searchTime: '', device: '', status: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

    useEffect(() => {
        fetchHistory();
    }, [pagination.page, filters.device, filters.status]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await iotService.getActionHistory(
                pagination.page,
                pagination.limit,
                filters.searchTime,
                filters.device,
                filters.status
            );
            setHistory(res.data || []);
            setPagination(prev => ({
                ...prev,
                total: res.total || 0,
                totalPages: res.totalPages || 0
            }));
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset về trang 1 khi lọc
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'success': return { color: 'text-green-500', bg: 'bg-green-50', icon: 'fa-check-circle', text: 'Success' };
            case 'fail': return { color: 'text-red-500', bg: 'bg-red-50', icon: 'fa-times-circle', text: 'Fail' };
            case 'processing': return { color: 'text-orange-500', bg: 'bg-orange-50', icon: 'fa-sync animate-spin', text: 'Processing' };
            default: return { color: 'text-slate-400', bg: 'bg-slate-50', icon: 'fa-info-circle', text: 'N/A' };
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "--";
        const date = new Date(dateString);
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    return (
        <main className="h-screen flex flex-col p-6 overflow-hidden bg-slate-50 gap-4">
            {/* Header & Filter */}
            <header className="flex justify-between items-center h-12">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Lịch sử thiết bị</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nhật ký hệ thống</p>
                </div>
                {/* Nút làm mới nhanh */}
                <button onClick={fetchHistory} className="p-2 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:bg-slate-50 transition-all">
                    <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''} mr-2`}></i> LÀM MỚI
                </button>
            </header>

            {/* Bộ lọc Filters */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-4 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tìm kiếm thời gian</label>
                        <input
                            type="text" id="searchTime" value={filters.searchTime} onChange={handleFilterChange}
                            onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
                            placeholder="2026-02-14..."
                            className="w-full px-4 py-2.5 rounded-2xl border bg-slate-50 outline-none focus:ring-2 ring-blue-500 text-xs font-semibold"
                        />
                    </div>
                    <div className="col-span-3">
                        <select id="device" value={filters.device} onChange={handleFilterChange} className="w-full px-4 py-2.5 rounded-2xl border bg-slate-50 text-xs font-bold outline-none focus:ring-2 ring-blue-500">
                            <option value="">Tất cả thiết bị</option>
                            <option value="1">Light</option>
                            <option value="2">Fan</option>
                            <option value="3">Air Conditioner</option>
                        </select>
                    </div>
                    <div className="col-span-3">
                        <select id="status" value={filters.status} onChange={handleFilterChange} className="w-full px-4 py-2.5 rounded-2xl border bg-slate-50 text-xs font-bold outline-none focus:ring-2 ring-blue-500">
                            <option value="">Tất cả trạng thái</option>
                            <option value="Success">Success</option>
                            <option value="Fail">Fail</option>
                            <option value="Processing">Processing</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <button onClick={fetchHistory} className="w-full py-2.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Lọc</button>
                    </div>
                </div>
            </div>

            {/* Bảng dữ liệu Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden flex-grow">
                <div className="overflow-y-auto flex-grow custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white border-b z-10">
                            <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                <th className="p-5 px-8">ID</th>
                                <th className="p-5 px-8">Thiết bị</th>
                                <th className="p-5 text-center">Hành động</th>
                                <th className="p-5 px-8 text-right">Thời gian ghi nhận</th>
                                <th className="p-5 px-8 text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[13px] font-bold text-slate-600">
                            {loading ? (
                                <tr><td colSpan="5" className="p-20 text-center"><i className="fas fa-spinner animate-spin text-blue-600 text-2xl"></i></td></tr>
                            ) : history.length > 0 ? (
                                history.map((item) => {
                                    const statusStyle = getStatusStyle(item.Status);
                                    return (
                                        <tr key={item.ID} className="hover:bg-blue-50/40 group transition-colors">
                                            <td className="p-4 px-8 text-slate-300 font-mono text-[11px]">#{item.ID}</td>
                                            <td className="p-4 px-8">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${item.DeviceID == 1 ? 'bg-yellow-400' : item.DeviceID == 2 ? 'bg-blue-400' : 'bg-cyan-400'}`}></div>
                                                    <span className="text-slate-800">{item.DeviceName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-4 py-1.5 rounded-xl font-black uppercase text-[9px] tracking-widest ${item.Action === 'ON' ? 'text-blue-600 bg-blue-50 border border-blue-100' : 'text-red-500 bg-red-50 border border-red-100'}`}>
                                                    {item.Action}
                                                </span>
                                            </td>
                                            <td className="p-4 px-8 text-right font-mono text-slate-400 group-hover:text-blue-600 tracking-tighter italic text-[11px] transition-colors">
                                                {formatDateTime(item.CreateAt)}
                                            </td>
                                            <td className="p-4 px-8 text-right">
                                                <span className={`${statusStyle.color} ${statusStyle.bg} px-3 py-1.5 rounded-xl text-[9px] font-black uppercase inline-flex items-center gap-1.5 border border-current opacity-80`}>
                                                    <i className={`fas ${statusStyle.icon}`}></i>
                                                    {statusStyle.text}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="p-20 text-center text-slate-400 uppercase text-[10px] font-bold">Không có dữ liệu lịch sử</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50/50 p-2">
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </main>
    );
};

export default ActionHistory;