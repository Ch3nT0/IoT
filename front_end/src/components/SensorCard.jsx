import React from 'react';
import tinycolor from 'tinycolor2';

const SensorCard = ({ title, value, unit, iconClass, isOffline }) => {
    // Logic nội suy màu (Giữ nguyên của Chen)
    const colorConfigs = {
        'Nhiệt độ': [{ value: 10, color: '#3b82f6' }, { value: 28, color: '#10b981' }, { value: 35, color: '#f59e0b' }, { value: 45, color: '#ef4444' }],
        'Độ ẩm': [{ value: 20, color: '#f97316' }, { value: 60, color: '#06b6d4' }, { value: 90, color: '#3b82f6' }],
        'Ánh sáng': [{ value: 0, color: '#1e293b' }, { value: 400, color: '#475569' }, { value: 800, color: '#fbbf24' }, { value: 1023, color: '#fef3c7' }]
    };

    const getInterpolatedColor = (type, val) => {
        const config = colorConfigs[type] || [{ value: 0, color: '#64748b' }];
        if (val <= config[0].value) return config[0].color;
        if (val >= config[config.length - 1].value) return config[config.length - 1].color;
        let lower, upper;
        for (let i = 0; i < config.length - 1; i++) {
            if (val >= config[i].value && val <= config[i + 1].value) {
                lower = config[i]; upper = config[i + 1]; break;
            }
        }
        const ratio = (val - lower.value) / (upper.value - lower.value);
        return tinycolor.mix(lower.color, upper.color, ratio * 100).toHexString();
    };

    // Xử lý màu sắc khi Offline
    let mainColor = isOffline ? '#94a3b8' : getInterpolatedColor(title, value);
    const isDarkBg = tinycolor(mainColor).isDark();
    const textColor = isDarkBg ? 'text-white' : 'text-slate-900';

    return (
        <div 
            className={`relative p-7 rounded-[2.5rem] flex items-center justify-between h-32 transition-all duration-500 shadow-2xl ${textColor} ${isOffline ? 'opacity-70' : ''}`}
            style={{ 
                background: `linear-gradient(135deg, ${mainColor}, ${tinycolor(mainColor).darken(10).toHexString()})`,
                boxShadow: isOffline ? 'none' : `0 20px 40px -15px ${mainColor}aa`
            }}
        >
            <div className="flex items-center gap-5 z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border ${isOffline ? 'bg-slate-200/20 border-transparent' : 'bg-white/15 border-white/20 backdrop-blur-2xl'}`}>
                    <i className={`${iconClass} text-3xl ${isOffline ? 'text-slate-300 animate-pulse' : ''}`}></i>
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight leading-none uppercase">{title}</span>
                    {isOffline && <span className="text-[10px] font-black text-red-200 tracking-widest mt-1">OFFLINE</span>}
                </div>
            </div>

            <div className="text-right z-10">
                <div className="flex items-baseline justify-end gap-1">
                    <h3 className="text-6xl font-black tracking-tighter leading-none">
                        {isOffline ? 'OFF' : value}
                    </h3>
                    {!isOffline && <span className="text-2xl font-bold opacity-60 ml-1">{unit}</span>}
                </div>
            </div>
        </div>
    );
};

export default SensorCard;