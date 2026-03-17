import React from 'react';

const Profile = () => {
  const links = [
    {
      name: 'Github',
      iconClass: 'fab fa-github',
      url: 'https://github.com/Ch3nT0/IoT',
      hoverClass: 'hover:bg-slate-900 hover:border-slate-800',
      iconColor: 'text-slate-800'
    },
    {
      name: 'API Doc',
      iconClass: 'fas fa-code',
      url: 'http://localhost:3001/api-docs',
      hoverClass: 'hover:bg-blue-600 hover:border-blue-500',
      iconColor: 'text-blue-600'
    },
    {
      name: 'Figma UI',
      iconClass: 'fab fa-figma',
      url: 'https://www.figma.com/design/QGiGF1FfYAojdipXkfaj3U/Untitled?node-id=10-33&t=MKr1fdtSikpNXWmQ-0',
      hoverClass: 'hover:bg-purple-600 hover:border-purple-500',
      iconColor: 'text-purple-600'
    },
    {
      name: 'Báo cáo',
      iconClass: 'fas fa-file-pdf',
      url: 'https://docs.google.com/document/d/1MZ06vs_XDlT54wui9Uk6ZgAhx_Jf-ZD_8DfNOvmcE5Q/edit?tab=t.0',
      hoverClass: 'hover:bg-red-600 hover:border-red-500',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <main className="flex-grow min-h-screen p-10 flex items-center justify-center bg-slate-50">
      <div className="max-w-3xl w-full bg-white rounded-[48px] shadow-sm border border-slate-100 p-12 text-center transition-all hover:shadow-xl">
        
        {/* Avatar Section */}
        <div className="relative w-36 h-36 mx-auto mb-8">
          <img 
            src="https://res.cloudinary.com/dxadiqrwd/image/upload/v1765972400/lg3ngde5eahuynns8cnk.png" 
            alt="User Avatar"
            className="w-full h-full rounded-full border-8 border-slate-50 shadow-inner object-cover"
          />
          <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
        </div>

        {/* Info Section */}
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Lê Doãn Mạnh</h2>
        <p className="text-blue-600 font-bold mb-12 uppercase tracking-[0.2em] text-[10px] bg-blue-50 inline-block px-4 py-1 rounded-full">
          Cloud / BackEnd Developer
        </p>
        
        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {links.map((link, index) => (
            <a 
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group p-8 bg-slate-50 rounded-[32px] transition-all duration-300 flex flex-col items-center border border-transparent ${link.hoverClass}`}
            >
              <i className={`${link.iconClass} text-4xl mb-3 ${link.iconColor} group-hover:text-white transition-colors`}></i>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-200 transition-colors">
                {link.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Profile;