import React from 'react';
import { NavLink } from 'react-router-dom'; // Sử dụng NavLink để quản lý trạng thái active
import { LayoutDashboard, Database, History, User, Bolt } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Sensor Data', icon: <Database size={20} />, path: '/sensors' },
    { name: 'History', icon: <History size={20} />, path: '/history' },
    { name: 'Profile', icon: <User size={20} />, path: '/profile' },
  ];

  return (
    <nav className="w-72 bg-slate-900 h-screen sticky top-0 p-6 flex flex-col text-slate-400">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2 text-white">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
          <Bolt size={20} fill="white" />
        </div>
        <h2 className="text-xl font-bold tracking-wider uppercase">Smart Home</h2>
      </div>

      {/* Menu List */}
      <div className="space-y-3 flex-grow text-sm uppercase font-bold">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            // React Router cung cấp thuộc tính isActive để chúng ta check trạng thái route
            className={({ isActive }) =>
              `flex p-4 rounded-xl items-center gap-3 transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' 
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Sidebar (Tùy chọn) */}
      <div className="pt-6 border-t border-slate-800 text-[10px] text-center opacity-50 uppercase tracking-widest">
        v1.0.0 - IoT System
      </div>
    </nav>
  );
};

export default Sidebar;