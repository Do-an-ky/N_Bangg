import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginMember, loginStaff } from '../api/auth';
import { useAuth } from '../store/AuthContext';
import Spinner from '../components/ui/Spinner';

// Decorative book stack SVG illustration
function BookIllustration() {
  return (
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" className="w-48 h-28 mx-auto">
      {/* Shelf */}
      <rect x="10" y="100" width="180" height="8" rx="2" fill="#b8922a" opacity="0.6" />

      {/* Book 1 — tall dark blue */}
      <rect x="22" y="45" width="20" height="57" rx="2" fill="#1e3575" />
      <rect x="22" y="45" width="4" height="57" rx="1" fill="#0d1a45" />
      <rect x="28" y="55" width="8" height="1.5" rx="1" fill="white" opacity="0.3" />
      <rect x="28" y="60" width="6" height="1.5" rx="1" fill="white" opacity="0.2" />

      {/* Book 2 — medium gold/amber */}
      <rect x="46" y="36" width="22" height="66" rx="2" fill="#c9a030" />
      <rect x="46" y="36" width="4" height="66" rx="1" fill="#9a7820" />
      <rect x="53" y="48" width="9" height="1.5" rx="1" fill="white" opacity="0.4" />
      <rect x="53" y="53" width="7" height="1.5" rx="1" fill="white" opacity="0.3" />

      {/* Book 3 — wide burgundy */}
      <rect x="72" y="52" width="28" height="50" rx="2" fill="#7b2d2d" />
      <rect x="72" y="52" width="5" height="50" rx="1" fill="#5a1f1f" />
      <rect x="80" y="62" width="12" height="1.5" rx="1" fill="white" opacity="0.35" />
      <rect x="80" y="67" width="9" height="1.5" rx="1" fill="white" opacity="0.25" />

      {/* Book 4 — slim green */}
      <rect x="104" y="42" width="16" height="60" rx="2" fill="#2d6a4f" />
      <rect x="104" y="42" width="3" height="60" rx="1" fill="#1b4332" />
      <rect x="110" y="54" width="6" height="1.5" rx="1" fill="white" opacity="0.3" />

      {/* Book 5 — wider navy with gold spine detail */}
      <rect x="124" y="30" width="24" height="72" rx="2" fill="#2c4a8c" />
      <rect x="124" y="30" width="4" height="72" rx="1" fill="#1e3575" />
      <rect x="131" y="42" width="10" height="1.5" rx="1" fill="#d4a853" opacity="0.7" />
      <rect x="131" y="47" width="8" height="1" rx="0.5" fill="#d4a853" opacity="0.5" />
      <rect x="131" y="90" width="10" height="1.5" rx="1" fill="#d4a853" opacity="0.7" />

      {/* Book 6 — small tan/cream */}
      <rect x="152" y="62" width="18" height="40" rx="2" fill="#c8a97e" />
      <rect x="152" y="62" width="3" height="40" rx="1" fill="#a67c52" />
      <rect x="158" y="72" width="7" height="1.5" rx="1" fill="white" opacity="0.4" />

      {/* Lying book on top of books */}
      <rect x="46" y="30" width="60" height="9" rx="2" fill="#d4a853" />
      <rect x="46" y="30" width="60" height="3" rx="1" fill="#b8922a" />

      {/* Subtle glow under shelf */}
      <ellipse cx="100" cy="108" rx="80" ry="4" fill="#b8922a" opacity="0.12" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('member');

  const [maThe, setMaThe] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [email, setEmail] = useState('');
  const [staffPwd, setStaffPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validateMember() {
    if (!maThe.trim()) return 'Vui lòng nhập mã thẻ bạn đọc';
    if (matKhau.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
    return null;
  }

  function validateStaff() {
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
    if (staffPwd.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validErr = tab === 'member' ? validateMember() : validateStaff();
    if (validErr) { setError(validErr); return; }
    setLoading(true);
    try {
      let result;
      if (tab === 'member') {
        result = await loginMember(maThe.trim(), matKhau);
      } else {
        result = await loginStaff(email.trim(), staffPwd);
      }
      login(result.data.token, { ...result.data.user, userType: tab === 'member' ? 'member' : 'staff' });
      if (tab === 'member') navigate('/member/search');
      else navigate('/staff/dashboard');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#b8922a" opacity="0.12" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Decorative corner ornaments */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 Q100 0 100 100 Q100 0 200 0" stroke="#0d1a45" strokeWidth="40" fill="none"/>
        </svg>
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-parchment-200">

          {/* Card header — dark navy with illustration */}
          <div className="bg-primary-900 px-8 pt-8 pb-6 text-center relative overflow-hidden">
            {/* Subtle pattern inside header */}
            <div className="absolute inset-0 opacity-5">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="white" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hatch)" />
              </svg>
            </div>

            <div className="relative">
              <BookIllustration />
              <h1 className="font-serif text-white text-2xl font-bold mt-4">Thư viện Trường</h1>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <div className="h-px w-10 bg-gold-500/40" />
                <p className="text-white/50 text-xs tracking-widest uppercase">Quản lý thư viện</p>
                <div className="h-px w-10 bg-gold-500/40" />
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-parchment-200">
            {[
              { key: 'member', label: 'Bạn đọc (OPAC)' },
              { key: 'staff', label: 'Nhân viên / Quản lý' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-medium transition-all border-b-2 ${
                  tab === key
                    ? 'text-primary-800 border-gold-500 bg-parchment-50'
                    : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-parchment-50/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {tab === 'member' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-primary-800 uppercase tracking-wide mb-1.5">
                      Mã thẻ bạn đọc
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="VD: BD20240001"
                      value={maThe}
                      onChange={(e) => setMaThe(e.target.value)}
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-800 uppercase tracking-wide mb-1.5">
                      Mật khẩu
                    </label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={matKhau}
                      onChange={(e) => setMatKhau(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-primary-800 uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <input
                      className="input"
                      type="email"
                      placeholder="nhanvien@thuvien.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-800 uppercase tracking-wide mb-1.5">
                      Mật khẩu
                    </label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={staffPwd}
                      onChange={(e) => setStaffPwd(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-800 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            {tab === 'member' && (
              <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
                Chưa có mật khẩu?<br />
                Liên hệ thủ thư để kích hoạt tài khoản.
              </p>
            )}
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-400 mt-5">
          © {new Date().getFullYear()} Hệ thống Quản lý Thư viện
        </p>
      </div>
    </div>
  );
}
