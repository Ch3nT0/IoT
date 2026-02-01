const SensorCard = ({ title, value, unit, iconClass, gradient, isDarkText }) => {
  const textColor = isDarkText ? 'text-slate-800' : 'text-white';

  return (
    <div 
      className={`p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between min-h-[180px] transition-all duration-700 ${textColor}`}
      style={{ background: gradient }}
    >
      <div className="flex justify-between items-start">
        <p className="font-bold uppercase text-xs opacity-70 tracking-wider">{title}</p>
        {/* Sử dụng Font Awesome icon từ class truyền vào */}
        <i className={`${iconClass} text-2xl opacity-40`}></i>
      </div>
      <h3 className="text-6xl font-black flex items-baseline">
        {value}
        <span className={`${unit === '°C' || unit === '%' ? '' : 'text-2xl ml-2'} opacity-80`}>
          {unit}
        </span>
      </h3>
    </div>
  );
};

export default SensorCard;