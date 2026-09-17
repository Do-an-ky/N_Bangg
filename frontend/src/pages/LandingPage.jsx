import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchBooks } from '../api/books';
import { useAuth } from '../store/AuthContext';
import BookCover from '../components/ui/BookCover';
import { IconBookOpen, IconSearch, IconCalendar, IconUsers, IconChevronRight } from '../components/ui/Icons';

// Giá sách hero SVG (phiên bản lớn hơn)
function HeroShelf() {
  return (
    <svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
      {/* Shelf plank */}
      <rect x="10" y="168" width="340" height="12" rx="3" fill="#b8922a" opacity="0.7" />
      <rect x="10" y="168" width="340" height="4" rx="2" fill="#d4a853" opacity="0.5" />

      {/* Book 1 — tall navy */}
      <rect x="28" y="80" width="30" height="90" rx="3" fill="#1e3575" />
      <rect x="28" y="80" width="6" height="90" rx="2" fill="#0d1a45" />
      <rect x="37" y="96" width="14" height="2" rx="1" fill="#d4a853" opacity="0.7" />
      <rect x="37" y="101" width="10" height="1.5" rx="1" fill="#d4a853" opacity="0.4" />
      <rect x="37" y="148" width="14" height="2" rx="1" fill="#d4a853" opacity="0.7" />

      {/* Book 2 — wide burgundy */}
      <rect x="62" y="68" width="38" height="102" rx="3" fill="#7b2d2d" />
      <rect x="62" y="68" width="7" height="102" rx="2" fill="#5a1f1f" />
      <rect x="72" y="86" width="20" height="2" rx="1" fill="#fde8d8" opacity="0.5" />
      <rect x="72" y="91" width="16" height="1.5" rx="1" fill="#fde8d8" opacity="0.35" />
      <rect x="72" y="150" width="18" height="2" rx="1" fill="#fde8d8" opacity="0.4" />

      {/* Book 3 — slim green */}
      <rect x="104" y="88" width="22" height="82" rx="3" fill="#2d6a4f" />
      <rect x="104" y="88" width="5" height="82" rx="2" fill="#1b4332" />
      <rect x="112" y="104" width="9" height="2" rx="1" fill="#d8f3dc" opacity="0.5" />

      {/* Book 4 — lying on top */}
      <rect x="62" y="60" width="80" height="12" rx="2" fill="#c9a030" />
      <rect x="62" y="60" width="80" height="4" rx="1" fill="#9a7820" />

      {/* Book 5 — very tall navy with gold stripe */}
      <rect x="130" y="52" width="34" height="118" rx="3" fill="#2c4a8c" />
      <rect x="130" y="52" width="6" height="118" rx="2" fill="#1e3575" />
      <rect x="139" y="70" width="18" height="2.5" rx="1" fill="#d4a853" opacity="0.8" />
      <rect x="139" y="75" width="14" height="1.5" rx="1" fill="#d4a853" opacity="0.5" />
      <rect x="139" y="155" width="18" height="2.5" rx="1" fill="#d4a853" opacity="0.8" />

      {/* Book 6 — amber/tan */}
      <rect x="168" y="96" width="26" height="74" rx="3" fill="#c8a97e" />
      <rect x="168" y="96" width="5" height="74" rx="2" fill="#a67c52" />
      <rect x="176" y="112" width="11" height="2" rx="1" fill="white" opacity="0.45" />

      {/* Book 7 — plum */}
      <rect x="198" y="74" width="28" height="96" rx="3" fill="#5b2d8c" />
      <rect x="198" y="74" width="5" height="96" rx="2" fill="#3b1f5a" />
      <rect x="206" y="90" width="13" height="2" rx="1" fill="#ede0ff" opacity="0.5" />
      <rect x="206" y="148" width="13" height="2" rx="1" fill="#ede0ff" opacity="0.4" />

      {/* Book 8 — teal */}
      <rect x="230" y="60" width="24" height="110" rx="3" fill="#0f766e" />
      <rect x="230" y="60" width="5" height="110" rx="2" fill="#1f3a47" />
      <rect x="238" y="80" width="10" height="2" rx="1" fill="#ccfbf1" opacity="0.5" />

      {/* Book 9 — lying on top of teal */}
      <rect x="198" y="66" width="70" height="10" rx="2" fill="#b8922a" opacity="0.8" />
      <rect x="198" y="66" width="70" height="3" rx="1" fill="#9a7820" opacity="0.7" />

      {/* Book 10 — wide red-orange */}
      <rect x="258" y="84" width="36" height="86" rx="3" fill="#c2410c" />
      <rect x="258" y="84" width="6" height="86" rx="2" fill="#9a3412" />
      <rect x="267" y="100" width="18" height="2" rx="1" fill="#fef3c7" opacity="0.5" />
      <rect x="267" y="105" width="14" height="1.5" rx="1" fill="#fef3c7" opacity="0.35" />

      {/* Book 11 — slim navy */}
      <rect x="298" y="92" width="18" height="78" rx="3" fill="#243b73" />
      <rect x="298" y="92" width="4" height="78" rx="2" fill="#1c2951" />

      {/* Book 12 — wide cream/beige */}
      <rect x="320" y="76" width="28" height="94" rx="3" fill="#d4b896" />
      <rect x="320" y="76" width="5" height="94" rx="2" fill="#b8966e" />
      <rect x="328" y="94" width="12" height="2" rx="1" fill="#5a3a1a" opacity="0.4" />

      {/* Ambient glow under shelf */}
      <ellipse cx="180" cy="180" rx="150" ry="6" fill="#b8922a" opacity="0.1" />
    </svg>
  );
}

function StepCard({ num, Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-full bg-primary-900 flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6 text-gold-400" />
        </div>
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-500 text-white text-xs font-bold flex items-center justify-center">
          {num}
        </span>
      </div>
      <h3 className="font-serif font-semibold text-primary-900 text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    searchBooks({ limit: 6 }).then((r) => setFeatured(r.data || [])).catch(() => {});
  }, []);

  function goDashboard() {
    if (user?.userType === 'staff') navigate('/staff/dashboard');
    else if (user?.userType === 'member') navigate('/member/search');
    else navigate('/login');
  }

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col">
      {/* ─── Nav ─── */}
      <header className="bg-primary-900 text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gold-500/20 rounded-lg flex items-center justify-center">
              <IconBookOpen className="w-4.5 h-4.5 text-gold-400" />
            </div>
            <span className="font-serif font-bold text-white text-[15px]">Thư viện Trường</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={goDashboard} className="bg-gold-500 hover:bg-gold-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Vào trang cá nhân →
              </button>
            ) : (
              <>
                <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Đăng nhập</Link>
                <Link to="/login" className="bg-gold-500 hover:bg-gold-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  Bắt đầu mượn sách
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="bg-primary-900 text-white pb-20 pt-12 px-6 relative overflow-hidden">
        {/* Pattern bg */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gold-500/15 border border-gold-500/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                <span className="text-gold-300 text-xs font-medium tracking-wide">Dịch vụ mượn sách trực tuyến</span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                Mượn sách<br />
                <span className="text-gold-400">mọi lúc, mọi nơi</span>
              </h1>

              <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">
                Tìm kiếm, đặt trước và mượn tài liệu thư viện trực tuyến. Không cần xếp hàng — sách đã sẵn sàng khi bạn đến.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="bg-gold-500 hover:bg-gold-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  Đặt mượn ngay
                  <IconChevronRight className="w-4 h-4" />
                </Link>
                <a href="#catalog" className="border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors">
                  Xem danh mục sách
                </a>
              </div>

              {/* Stats row */}
              <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
                {[
                  { n: '500+', l: 'Tài liệu' },
                  { n: '24/7', l: 'Đặt trước online' },
                  { n: '3 ngày', l: 'Giữ sách chờ bạn' },
                ].map(({ n, l }) => (
                  <div key={l}>
                    <p className="font-serif text-2xl font-bold text-gold-400">{n}</p>
                    <p className="text-white/50 text-xs mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: illustration */}
            <div className="hidden md:block">
              <HeroShelf />
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-16 px-6 bg-white border-b border-parchment-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gold-500 text-xs font-semibold uppercase tracking-widest mb-2">Quy trình</p>
            <h2 className="font-serif text-2xl font-bold text-primary-900">Mượn sách chỉ 3 bước</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="h-px w-12 bg-gold-400/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
              <div className="h-px w-12 bg-gold-400/40" />
            </div>
          </div>

          {/* Connector line */}
          <div className="relative">
            <div className="hidden md:block absolute top-7 left-1/6 right-1/6 h-px bg-parchment-300 z-0" />
            <div className="grid md:grid-cols-3 gap-0 relative z-10">
              <StepCard
                num="1"
                Icon={IconUsers}
                title="Đăng ký thẻ bạn đọc"
                desc="Đến thư viện làm thẻ lần đầu. Sau đó bạn có thể dùng hệ thống online."
              />
              <StepCard
                num="2"
                Icon={IconSearch}
                title="Tìm sách yêu thích"
                desc="Tra cứu theo tiêu đề, tác giả, ISBN. Xem bản sao còn sẵn hay đã được mượn hết."
              />
              <StepCard
                num="3"
                Icon={IconCalendar}
                title="Đặt mượn & đến lấy"
                desc="Bấm 'Đặt mượn ngay' — chúng tôi sẽ giữ sách trong 3 ngày để bạn đến lấy."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Featured books ─── */}
      {featured.length > 0 && (
        <section id="catalog" className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-gold-500 text-xs font-semibold uppercase tracking-widest mb-1">Danh mục</p>
                <h2 className="font-serif text-2xl font-bold text-primary-900">Tài liệu nổi bật</h2>
              </div>
              <Link to="/login" className="text-sm text-primary-600 hover:text-gold-600 font-medium transition-colors flex items-center gap-1">
                Xem tất cả <IconChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {featured.map((book) => (
                <Link
                  key={book.id}
                  to="/login"
                  className="group flex flex-col items-center text-center hover:-translate-y-1 transition-transform"
                >
                  <div className="mb-3 drop-shadow-lg group-hover:drop-shadow-xl transition-all">
                    <BookCover title={book.nhan_de} author={book.tac_gia} size="md" />
                  </div>
                  <p className="text-xs font-semibold text-primary-900 leading-tight line-clamp-2 max-w-24">{book.nhan_de}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-24">{book.tac_gia?.split(',')[0]}</p>
                  {/* Availability badge */}
                  {book.sanSang > 0
                    ? <span className="mt-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Có sẵn</span>
                    : <span className="mt-1 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Đang mượn</span>
                  }
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA banner ─── */}
      <section className="bg-primary-900 py-14 px-6 text-center">
        <h2 className="font-serif text-2xl font-bold text-white mb-3">
          Sẵn sàng đặt mượn sách?
        </h2>
        <p className="text-white/50 mb-6 max-w-md mx-auto">
          Đăng nhập bằng mã thẻ bạn đọc để tra cứu và đặt mượn tài liệu ngay hôm nay.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Đăng nhập ngay
          <IconChevronRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-parchment-200 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Hệ thống Quản lý Thư viện Trường
      </footer>
    </div>
  );
}
