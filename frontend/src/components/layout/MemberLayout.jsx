import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import NotificationBell from '../ui/NotificationBell';
import { IconBookOpen, IconMenu, IconKey, IconLogOut, IconSearch, IconClipboardList, IconCalendar, IconWallet, IconUser } from '../ui/Icons';

const navItems = [
  { to: '/member/search', label: 'Tra cứu', Icon: IconSearch },
  { to: '/member/loans', label: 'Đang mượn', Icon: IconClipboardList },
  { to: '/member/reservations', label: 'Đặt trước', Icon: IconCalendar },
  { to: '/member/debt', label: 'Công nợ', Icon: IconWallet },
  { to: '/member/profile', label: 'Hồ sơ', Icon: IconUser },
];

export default function MemberLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-parchment-100">
      {/* Header */}
      <header className="bg-primary-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/member/search" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <IconBookOpen className="w-4.5 h-4.5 text-gold-400" />
            </div>
            <span className="font-serif font-semibold text-white text-[15px] leading-tight hidden sm:block">
              Thư viện Trường
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-gold-300 border-b-2 border-gold-400'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-white/40'}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <span className="hidden lg:block text-sm text-white/50">
              Xin chào, <span className="font-medium text-white/80">{user?.hoTen}</span>
            </span>
            <div className="[&_button]:text-white/60 [&_button:hover]:text-white">
              <NotificationBell />
            </div>
            <Link
              to="/change-password"
              className="hidden md:flex items-center gap-1 text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              <IconKey className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-md transition-colors"
            >
              <IconLogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
            <button
              className="md:hidden p-2 text-white/60 hover:text-white"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconMenu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden bg-primary-800/95 border-t border-white/10 px-4 py-2 flex flex-col gap-0.5">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-gold-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-white/40'}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
            <div className="flex gap-3 px-3 pt-2 pb-1 border-t border-white/10 mt-1">
              <Link to="/change-password" onClick={() => setMenuOpen(false)} className="text-xs text-white/40 hover:text-white/70">Đổi mật khẩu</Link>
              <button onClick={handleLogout} className="text-xs text-red-400/70 hover:text-red-400">Đăng xuất</button>
            </div>
          </nav>
        )}
      </header>

      {/* Page */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-parchment-200 text-center text-xs text-gray-400 py-4">
        © {new Date().getFullYear()} Hệ thống Quản lý Thư viện
      </footer>
    </div>
  );
}
