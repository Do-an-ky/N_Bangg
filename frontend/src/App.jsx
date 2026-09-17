import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Member pages
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/member/SearchPage';
import BookDetailPage from './pages/member/BookDetailPage';
import MyLoansPage from './pages/member/MyLoansPage';
import MyReservationsPage from './pages/member/MyReservationsPage';
import MyDebtPage from './pages/member/MyDebtPage';
import ProfilePage from './pages/member/ProfilePage';

// Staff pages
import DashboardPage from './pages/staff/DashboardPage';
import CheckoutPage from './pages/staff/CheckoutPage';
import ReturnPage from './pages/staff/ReturnPage';
import MemberListPage from './pages/staff/MemberListPage';
import MemberDetailPage from './pages/staff/MemberDetailPage';
import MemberRegisterPage from './pages/staff/MemberRegisterPage';
import LoanListPage from './pages/staff/LoanListPage';
import FineListPage from './pages/staff/FineListPage';
import DocumentListPage from './pages/staff/DocumentListPage';
import DocumentDetailPage from './pages/staff/DocumentDetailPage';
import ReportsPage from './pages/staff/ReportsPage';
import OrdersPage from './pages/staff/OrdersPage';
import InventoryPage from './pages/staff/InventoryPage';

// Shared pages
import LandingPage from './pages/LandingPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// Route guard: chỉ bạn đọc mới vào được member area
function RequireMember({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType === 'staff') return <Navigate to="/staff/dashboard" replace />;
  return children;
}

// Route guard: bất kỳ user đã đăng nhập (E2)
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Route guard: chỉ nhân viên (staff) mới vào được staff area
function RequireStaff({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType === 'member') return <Navigate to="/member/search" replace />;
  return children;
}

// Route guard: redirect đã đăng nhập đi khỏi login
function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user?.userType === 'member') return <Navigate to="/member/search" replace />;
  if (user?.userType === 'staff') return <Navigate to="/staff/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Member / OPAC area */}
        <Route path="/member" element={<Navigate to="/member/search" replace />} />
        <Route path="/member/search" element={<RequireMember><SearchPage /></RequireMember>} />
        <Route path="/member/books/:id" element={<RequireMember><BookDetailPage /></RequireMember>} />
        <Route path="/member/loans" element={<RequireMember><MyLoansPage /></RequireMember>} />
        <Route path="/member/reservations" element={<RequireMember><MyReservationsPage /></RequireMember>} />
        <Route path="/member/debt" element={<RequireMember><MyDebtPage /></RequireMember>} />
        <Route path="/member/profile" element={<RequireMember><ProfilePage /></RequireMember>} />

        {/* Staff area */}
        <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/staff/dashboard" element={<RequireStaff><DashboardPage /></RequireStaff>} />
        <Route path="/staff/checkout" element={<RequireStaff><CheckoutPage /></RequireStaff>} />
        <Route path="/staff/return" element={<RequireStaff><ReturnPage /></RequireStaff>} />
        <Route path="/staff/loans" element={<RequireStaff><LoanListPage /></RequireStaff>} />
        <Route path="/staff/fines" element={<RequireStaff><FineListPage /></RequireStaff>} />
        <Route path="/staff/members" element={<RequireStaff><MemberListPage /></RequireStaff>} />
        <Route path="/staff/members/new" element={<RequireStaff><MemberRegisterPage /></RequireStaff>} />
        <Route path="/staff/members/:id" element={<RequireStaff><MemberDetailPage /></RequireStaff>} />
        <Route path="/staff/documents" element={<RequireStaff><DocumentListPage /></RequireStaff>} />
        <Route path="/staff/documents/:id" element={<RequireStaff><DocumentDetailPage /></RequireStaff>} />
        <Route path="/staff/orders" element={<RequireStaff><OrdersPage /></RequireStaff>} />
        <Route path="/staff/inventory" element={<RequireStaff><InventoryPage /></RequireStaff>} />
        <Route path="/staff/reports" element={<RequireStaff><ReportsPage /></RequireStaff>} />

        {/* E2: Đổi mật khẩu — dùng chung, cần đăng nhập */}
        <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  );
}
