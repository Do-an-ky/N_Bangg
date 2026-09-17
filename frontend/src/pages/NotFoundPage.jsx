import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <span className="text-6xl mb-4">📚</span>
      <h1 className="text-4xl font-bold text-gray-800">404</h1>
      <p className="text-gray-500 mt-2 mb-6">Trang bạn tìm không tồn tại.</p>
      <Link to="/" className="btn-primary">Về trang chủ</Link>
    </div>
  );
}
