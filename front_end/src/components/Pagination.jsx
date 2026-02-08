import React from 'react';

const Pagination = ({ page, totalPages, total, onPageChange }) => {
    
    // Logic tính toán dải số trang hiển thị
    const getPaginationRange = () => {
        const delta = 1; // Số trang hiển thị bên cạnh trang hiện tại
        const range = [];
        const rangeWithDots = [];

        range.push(1);
        for (let i = page - delta; i <= page + delta; i++) {
            if (i > 1 && i < totalPages) {
                range.push(i);
            }
        }
        if (totalPages > 1) range.push(totalPages);

        let l;
        for (let i of range) {
            if (l) {
                if (i - l === 2) rangeWithDots.push(l + 1);
                else if (i - l > 2) rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            l = i;
        }
        return rangeWithDots;
    };

    if (totalPages <= 0) return null;


    
    return (
        <div className="p-4 bg-slate-50/50 border-t flex justify-between items-center h-20">
            {/* Thông tin số lượng */}
            <div className="flex flex-col ml-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tổng: <span className="text-blue-600 font-bold">{total}</span> bản ghi
                </span>
                <span className="text-[9px] text-slate-300 font-bold italic">
                    Trang {page} / {totalPages}
                </span>
            </div>

            {/* Điều hướng trang */}
            <div className="flex items-center gap-2 mr-6">
                {/* Nút Trước */}
                <button 
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all flex items-center justify-center shadow-sm"
                >
                    <i className="fas fa-chevron-left text-xs"></i>
                </button>

                {/* Danh sách số trang */}
                <div className="flex items-center gap-1">
                    {getPaginationRange().map((item, index) => {
                        if (item === '...') {
                            return (
                                <span key={index} className="w-8 text-center text-slate-300 font-black text-xs">...</span>
                            );
                        }
                        return (
                            <button
                                key={index}
                                onClick={() => onPageChange(item)}
                                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                                    page === item 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                                    : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50 shadow-sm'
                                }`}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>

                {/* Nút Sau */}
                <button 
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all flex items-center justify-center shadow-sm"
                >
                    <i className="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>
    );
};

export default Pagination;