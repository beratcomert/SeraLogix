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
  LogOut,
  ChevronRight
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
      path: "/devices",
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
      {/* Mobile Toggle Button - Floating Glass */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden fixed bottom-8 right-8 z-50 h-14 w-14 flex items-center justify-center rounded-2xl ${dark ? 'bg-green-600/90 text-white' : 'bg-green-600/90 text-white shadow-2xl shadow-green-500/40'} backdrop-blur-xl border border-white/10 transition-all active:scale-95`}
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Backdrop with heavy blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden transition-opacity duration-500"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-full z-40 transition-all duration-500 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-72 ${dark ? 'bg-slate-950/40 border-white/5 shadow-2xl' : 'bg-white/80 border-slate-200/50 shadow-xl'} backdrop-blur-2xl border-r flex flex-col overflow-hidden`}>
        
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
          <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[40%] bg-emerald-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>

        <div className="relative flex flex-col h-full z-10">
          {/* Logo Section */}
          <div className="p-8">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
                <Sprout size={28} />
              </div>
              <div>
                <h1 className={`text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-950'}`}>
                  SeraLogix
                </h1>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Smart Garden v1.0
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-8 overflow-y-auto pt-2">
            <div>
              <p className={`px-4 text-[10px] font-black uppercase tracking-widest ${dark ? 'text-slate-600' : 'text-slate-400'} mb-4`}>
                Ana Menü
              </p>
              <div className="space-y-1.5">
                {menuItems.map((item) => (
                  <Link 
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-4 rounded-3xl font-bold transition-all group relative overflow-hidden ${
                      isActive(item.path) 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                        : `${dark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'}`
                    }`}
                  >
                    <span className={`${isActive(item.path) ? 'text-white' : 'group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300'}`}>
                      {item.icon}
                    </span>
                    <span className="relative z-10 text-sm">{item.title}</span>
                    
                    {isActive(item.path) ? (
                      <ChevronRight size={16} className="ml-auto animate-bounce-x" />
                    ) : (
                      <div className="ml-auto w-1 h-1 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className={`px-4 text-[10px] font-black uppercase tracking-widest ${dark ? 'text-slate-600' : 'text-slate-400'} mb-4`}>
                Sistem
              </p>
              <div className="space-y-1.5">
                {bottomItems.map((item) => (
                  <Link 
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-4 rounded-3xl font-bold transition-all group ${
                      isActive(item.path) 
                        ? 'bg-emerald-600 text-white' 
                        : `${dark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'}`
                    }`}
                  >
                    <span className={`${isActive(item.path) ? 'text-white' : 'group-hover:scale-110 transition-transform duration-300'}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* User / Footer Section */}
          <div className="p-6 mt-auto">
            <button 
              onClick={onLogout}
              className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-3xl font-black text-sm transition-all relative overflow-hidden group ${dark ? 'bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-slate-100/50 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
            >
              <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-5 transition-opacity" />
              <LogOut size={20} />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
