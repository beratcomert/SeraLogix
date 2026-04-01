"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Cpu, 
  Settings, 
  HelpCircle, 
  Menu, 
  X,
  Sprout,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  dark?: boolean;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ dark, onLogout }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    {
      title: "Analizler",
      icon: <LayoutDashboard size={22} />,
      path: "/",
    },
    {
      title: "Cihazlar",
      icon: <Cpu size={22} />,
      path: "/devices", // We can create this page or just use it as a placeholder
    }
  ];

  const bottomItems = [
    {
      title: "Ayarlar",
      icon: <Settings size={22} />,
      path: "/settings",
    },
    {
      title: "Yardım",
      icon: <HelpCircle size={22} />,
      path: "/help",
    }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden fixed top-6 left-4 z-50 p-3 rounded-2xl ${dark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border shadow-lg`}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-full z-40 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-72 ${dark ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200'} border-r flex flex-col`}>
        
        {/* Logo Section */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
              <Sprout size={24} />
            </div>
            <h1 className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
              SeraLogix
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <div className="mb-4">
            <p className={`px-4 text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
              Ana Menü
            </p>
            {menuItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all group ${
                  isActive(item.path) 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                    : `${dark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-green-600'}`
                }`}
              >
                <span className={`${isActive(item.path) ? 'text-white' : 'group-hover:scale-110 transition-transform duration-300'}`}>
                  {item.icon}
                </span>
                {item.title}
                {isActive(item.path) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/5">
            <p className={`px-4 text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'} mb-4`}>
              Sistem
            </p>
            {bottomItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all group ${
                  isActive(item.path) 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                    : `${dark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-green-600'}`
                }`}
              >
                <span className={`${isActive(item.path) ? 'text-white' : 'group-hover:scale-110 transition-transform duration-300'}`}>
                  {item.icon}
                </span>
                {item.title}
              </Link>
            ))}
          </div>
        </nav>

        {/* User / Footer Section */}
        <div className="p-4 mt-auto">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all ${dark ? 'bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500'}`}
          >
            <LogOut size={22} />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
