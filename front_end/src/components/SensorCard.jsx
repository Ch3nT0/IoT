const SensorCard = ({ title, value, unit, iconClass, gradient, isDarkText }) => {
  const textColor = isDarkText ? 'text-slate-800' : 'text-white';

  return (
    <div 
      className={`p-5 rounded-[2rem] shadow-lg flex flex-col justify-between h-full transition-all duration-700 ${textColor}`}
      style={{ background: gradient }}
    >
      {/* Phần trên: Tiêu đề và Icon nhỏ hơn */}
      <div className="flex justify-between items-start">
        <p className="font-bold uppercase text-[10px] opacity-70 tracking-widest">{title}</p>
        <i className={`${iconClass} text-xl opacity-30`}></i>
      </div>

      {/* Phần dưới: Giá trị số hạ từ text-6xl xuống text-4xl */}
      <h3 className="text-4xl font-black flex items-baseline tracking-tighter">
        {value}
        <span className={`${unit === '°C' || unit === '%' ? 'text-lg ml-0.5' : 'text-sm ml-1.5'} opacity-70 font-bold`}>
          {unit}
        </span>
      </h3>
    </div>
  );
};

export default SensorCard;