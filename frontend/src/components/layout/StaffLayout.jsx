import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import NotificationBell from '../ui/NotificationBell';
import {
  IconArrowUpTray, IconArrowDownTray, IconClipboardList, IconBanknote,
  IconUsers, IconUserPlus, IconLibrary, IconShoppingBag, IconArchiveBox,
  IconChartBar, IconChartLine, IconKey, IconLogOut, IconMenu, IconBookOpen,
} from '../ui/Icons';

const ROLE_MAP = { thu_thu: 'Thủ thư', quan_ly: 'Quản lý', admin: 'Quản trị viên' };
const ROLE_LEVEL = { thu_thu: 1, quan_ly: 2, admin: 3 };
function checkRole(userRole, minRole) {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[minRole] || 0);
}

const NAV = [
  {
    title: 'Quầy mượn trả',
    items: [
      { to: '/staff/checkout', Icon: IconArrowUpTray, label: 'Cho mượn' },
      { to: '/staff/return', Icon: IconArrowDownTray, label: 'Trả sách' },
      { to: '/staff/loans', Icon: IconClipboardList, label: 'Theo dõi mượn' },
      { to: '/staff/fines', Icon: IconBanknote, label: 'Thu phạt' },
    ],
  },
  {
    title: 'Bạn đọc',
    items: [
      { to: '/staff/members', Icon: IconUsers, label: 'Danh sách thẻ' },
      { to: '/staff/members/new', Icon: IconUserPlus, label: 'Đăng ký thẻ' },
    ],
  },
  {
    title: 'Tài liệu',
    items: [
      { to: '/staff/documents', Icon: IconLibrary, label: 'Danh mục tài liệu' },
      { to: '/staff/orders', Icon: IconShoppingBag, label: 'Đơn đặt hàng', minRole: 'quan_ly' },
      { to: '/staff/inventory', Icon: IconArchiveBox, label: 'Kiểm kê' },
    ],
  },
  {
    title: 'Thống kê',
    items: [
      { to: '/staff/dashboard', Icon: IconChartBar, label: 'Dashboard', exact: true },
      { to: '/staff/reports', Icon: IconChartLine, label: 'Báo cáo', minRole: 'quan_ly' },
    ],
  },
];

function NavSection({ title, items, role }) {
  return (
    <div className="mb-5">
      <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
        {title}
      </p>
      {items
        .filter((item) => !item.minRole || checkRole(role, item.minRole))
        .map(({ to, Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 mb-0.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-700 text-white border-l-2 border-gold-400 pl-[14px]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold-400' : 'text-white/50'}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
    </div>
  );
}

function SidebarContent({ user, onLogout }) {
  return (
    <div className="flex flex-col h-full bg-primary-900">
      {/* Brand */}
      <Link
        to="/staff/dashboard"
        className="flex items-center gap-3 px-5 py-5 border-b border-white/10"
      >
        <div className="w-9 h-9 rounded-lg bg-gold-500/20 flex items-center justify-center shrink-0">
          <IconBookOpen className="w-5 h-5 text-gold-400" />
        </div>
        <div>
          <p className="font-serif text-white font-semibold leading-tight text-[15px]">Thư viện</p>
          <p className="text-white/40 text-[10px] tracking-wide">Hệ thống Quản lý</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV.map((section) => (
          <NavSection key={section.title} {...section} role={user?.role} />
        ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-700 border border-white/20 flex items-center justify-center shrink-0">
            <span className="text-white/80 text-xs font-semibold">
              {user?.hoTen?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white/90 text-xs font-medium truncate">{user?.hoTen}</p>
            <p className="text-white/40 text-[10px]">{ROLE_MAP[user?.role] || user?.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/change-password"
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            <IconKey className="w-3.5 h-3.5" />
            Đổi mật khẩu
          </Link>
          <span className="text-white/20">·</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-red-400/70 hover:text-red-400 text-xs transition-colors"
          >
            <IconLogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-parchment-100">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-56 fixed inset-y-0 left-0 z-10 shadow-xl">
        <SidebarContent user={user} onLogout={handleLogout} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div className="w-56 shadow-2xl">
            <SidebarContent user={user} onLogout={handleLogout} />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-56">
        {/* Top bar */}
        <header className="bg-white border-b border-parchment-200 px-4 h-14 flex items-center justify-between sticky top-0 z-10 shadow-sm md:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-primary-700 hover:bg-parchment-100 rounded-lg transition-colors md:hidden"
            aria-label="Mở menu"
          >
            <IconMenu className="w-5 h-5" />
          </button>
          <span className="font-serif font-semibold text-primary-900 md:hidden">Thư viện</span>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
