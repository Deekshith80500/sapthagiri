import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, History, LogOut, Plus, Menu, X, ChevronRight, Check, Zap, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import HistoryPage from './pages/History';
import Workers from './pages/Workers';
import Settings from './pages/Settings';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {}
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData: User) => setUser(userData);
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          
          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={user?.role === 'owner' ? <Dashboard /> : <Attendance />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="workers" element={<Workers />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={user?.role === 'owner' ? <Settings /> : <Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

// --- Layout Component ---
function Layout() {
  const { user, logout } = React.useContext(AuthContext);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['owner'] },
    { label: 'Attendance', icon: Calendar, path: '/attendance', roles: ['owner', 'leader'] },
    { label: 'Workers', icon: Users, path: '/workers', roles: ['owner', 'leader'] },
    { label: 'History', icon: History, path: '/history', roles: ['owner', 'leader'] },
    { label: 'Settings', icon: SettingsIcon, path: '/settings', roles: ['owner'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Floating Electricity Symbols */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.03]">
        <motion.div animate={{ y: [0, -100, 0], x: [0, 50, 0], rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity }} className="absolute top-1/4 left-1/4 text-electric"><Zap size={200} fill="currentColor" /></motion.div>
        <motion.div animate={{ y: [0, 100, 0], x: [0, -50, 0], rotate: [360, 0] }} transition={{ duration: 25, repeat: Infinity }} className="absolute bottom-1/4 right-1/4 text-electric"><Zap size={300} fill="currentColor" /></motion.div>
      </div>

      {/* Mobile Header */}
      <header className="bg-slate-950/60 backdrop-blur-md border-b border-white/5 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-electric rounded-lg flex items-center justify-center text-slate-950 shadow-sm shadow-electric/20 animate-zap">
            <Zap size={16} strokeWidth={3} fill="currentColor" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase">Power<span className="text-brand">Hub</span></h1>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand transition-colors">
          <Menu size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 max-w-md mx-auto"
          >
            <Routes>
              <Route index element={user?.role === 'owner' ? <Dashboard /> : <Attendance />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="workers" element={<Workers />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-4 py-2 z-40 h-[72px] shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        {filteredNav.map(item => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/');
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all ${
                isActive ? 'text-electric scale-110' : 'text-slate-500'
              }`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-electric/10 shadow-inner' : ''}`}>
                <Icon size={22} strokeWidth={isActive ? 3 : 2} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 px-4"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-3/4 max-w-xs bg-slate-950 z-[60] shadow-2xl p-8 flex flex-col border-l border-white/5"
            >
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="self-end p-2 -mr-2 mb-8 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-10 bg-slate-900 p-6 rounded-[32px] border-4 border-electric/20 shadow-2xl shadow-electric/10 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-electric/20 rounded-full blur-2xl" />
                <div className="w-14 h-14 bg-electric text-slate-900 rounded-[20px] flex items-center justify-center shadow-lg shadow-electric/40 relative z-10">
                  <UserIcon size={28} strokeWidth={3} />
                </div>
                <div className="relative z-10">
                  <h2 className="font-black text-white text-lg tracking-tight leading-none mb-1">{user?.name}</h2>
                  <div className="flex items-center gap-1.5 font-black text-electric uppercase tracking-widest text-[9px]">
                    <Zap size={10} fill="currentColor" className="animate-zap" />
                    {user?.role}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {filteredNav.map(item => {
                   const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/');
                   const Icon = item.icon;
                   return (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-[24px] transition-all ${
                        isActive 
                          ? 'bg-electric text-slate-950 shadow-xl shadow-electric/30' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isActive ? 'bg-slate-950/20' : 'bg-white/5'}`}>
                        <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                      </div>
                      <span className="font-black text-sm uppercase tracking-wide">{item.label}</span>
                      {isActive && <motion.div layoutId="activeInd" className="ml-auto w-2 h-2 bg-slate-950 rounded-full shadow-sm" />}
                    </Link>
                   );
                })}
              </div>

              <button 
                onClick={logout}
                className="mt-auto flex items-center gap-4 p-4 rounded-[24px] text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-500/10 transition-all group"
              >
                <div className="p-2 rounded-xl bg-rose-500/10 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <LogOut size={20} strokeWidth={3} />
                </div>
                <span>Terminate Session</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
