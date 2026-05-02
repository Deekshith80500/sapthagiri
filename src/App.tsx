import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, History, LogOut, Plus, Menu, X, ChevronRight, Check, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import HistoryPage from './pages/History';
import Workers from './pages/Workers';

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
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-brand">Attendance</h1>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2">
          <Menu size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24">
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
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center px-4 py-3 z-40">
        {filteredNav.map(item => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/');
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-brand' : 'text-gray-400'}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
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
              className="fixed right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white z-[60] shadow-2xl p-8 flex flex-col"
            >
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="self-end p-2 -mr-2 mb-8"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon size={24} className="text-gray-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{user?.name}</h2>
                  <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {filteredNav.map(item => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight size={18} className="text-gray-300" />
                  </Link>
                ))}
              </div>

              <button 
                onClick={logout}
                className="mt-auto flex items-center gap-3 p-4 text-red-500 font-medium"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
