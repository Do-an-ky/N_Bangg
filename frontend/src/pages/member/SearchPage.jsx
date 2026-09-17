// C1 - Tra cứu tài liệu
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchBooks } from '../../api/books';
import MemberLayout from '../../components/layout/MemberLayout';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import BookCover from '../../components/ui/BookCover';

const LOAI_MAP = { sach: 'Sách', bao: 'Báo', tap_chi: 'Tạp chí', luan_van: 'Luận văn', khac: 'Khác' };

function AvailabilityPill({ sanSang, total }) {
  if (sanSang > 0) return (
    <span className="badge bg-green-100 text-green-700">✓ Có sẵn ({sanSang}/{total})</span>
  );
  return <span className="badge bg-orange-100 text-orange-700">Đang mượn hết</span>;
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [loaiTaiLieu, setLoaiTaiLieu] = useState(params.get('loai') || '');
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await searchBooks({ q: query || undefined, loaiTaiLieu: loaiTaiLieu || undefined, page: p, limit: 12 });
      setBooks(res.data);
      setTotal(res.pagination.total);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, loaiTaiLieu]);

  // C1: tìm khi load hoặc khi params thay đổi
  useEffect(() => { fetch(1); }, []);

  function handleSearch(e) {
    e.preventDefault();
    setParams({ q: query, loai: loaiTaiLieu });
    fetch(1);
  }

  const totalPages = Math.ceil(total / 12);

  return (
    <MemberLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Tra cứu tài liệu</h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="card p-4 flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-1"
            type="search"
            placeholder="Tìm theo tiêu đề, tác giả, ISBN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <select
            className="input sm:w-40"
            value={loaiTaiLieu}
            onChange={(e) => setLoaiTaiLieu(e.target.value)}
          >
            <option value="">Tất cả loại</option>
            {Object.entries(LOAI_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary px-6" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Tìm kiếm'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-gray-500">
            {total > 0 ? `Tìm thấy ${total} tài liệu` : ''}
          </p>
        )}

        {/* Results grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : books.length === 0 && !error ? (
          <EmptyState icon="🔍" title="Không tìm thấy tài liệu" description="Thử tìm với từ khóa khác hoặc bỏ bộ lọc loại tài liệu" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <Link
                key={book.id}
                to={`/member/books/${book.id}`}
                className="card hover:shadow-md hover:border-primary-200 transition-all flex flex-col"
              >
                {/* Book cover */}
                <div className="flex justify-center mb-4">
                  {book.bia_sach_url
                    ? <img src={book.bia_sach_url} alt={book.nhan_de} className="h-32 object-contain rounded-lg shadow-md" />
                    : <BookCover title={book.nhan_de} author={book.tac_gia} size="md" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                      {book.nhan_de}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{book.tac_gia}</p>
                  {book.nha_xuat_ban && (
                    <p className="text-xs text-gray-400 mb-3">{book.nha_xuat_ban}{book.nam_xuat_ban ? `, ${book.nam_xuat_ban}` : ''}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{LOAI_MAP[book.loai_tai_lieu] || book.loai_tai_lieu}</span>
                  <AvailabilityPill sanSang={book.sanSang} total={book.tongBanSao} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <button
              className="btn-secondary px-3"
              onClick={() => fetch(page - 1)}
              disabled={page <= 1 || loading}
            >
              ← Trước
            </button>
            <span className="flex items-center text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              className="btn-secondary px-3"
              onClick={() => fetch(page + 1)}
              disabled={page >= totalPages || loading}
            >
              Tiếp →
            </button>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
