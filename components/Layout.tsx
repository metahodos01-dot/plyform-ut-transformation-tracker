import React, { useEffect, useState } from 'react';
import { LucideIcon, Menu, X, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { checkConnection } from '../services/firebase';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  navItems: NavItem[];
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, navItems }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const verify = async () => {
      const isConnected = await checkConnection();
      setDbStatus(isConnected ? 'connected' : 'error');
    };
    verify();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="font-bold text-xl tracking-tight">PLYFORM <span className="text-blue-400">UT</span></div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="text-2xl font-bold text-white tracking-wider">PLYFORM</h1>
          <p className="text-xs text-blue-400 font-semibold uppercase mt-1">Transformation Tracker</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            <p>Project: UT Optimization</p>
            <div className="mt-2 flex items-center justify-between">
              <span>Database:</span>
              {dbStatus === 'checking' && <Loader2 size={14} className="animate-spin text-slate-400" />}
              {dbStatus === 'connected' && (
                <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                  <Wifi size={14}/> Online
                </span>
              )}
              {dbStatus === 'error' && (
                <span className="text-red-400 flex items-center gap-1.5 font-medium">
                  <WifiOff size={14}/> Offline
                </span>
              )}
            </div>
            {dbStatus === 'error' && (
               <p className="mt-2 text-[10px] text-red-300 leading-tight">
                 Verifica regole Firestore e Auth Anonima.
               </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};