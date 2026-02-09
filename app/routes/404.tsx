import { useNavigate } from 'react-router';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-th text-white text-xl"></i>
            </div>
            <span className="font-bold text-2xl text-gray-900">UniClubs</span>
          </div>
        </div>

        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-64 h-64 bg-orange-100 rounded-full mb-6">
            <div className="text-center">
              <i className="fas fa-search text-orange-500 text-6xl mb-4"></i>
              <div className="text-orange-600 text-8xl font-bold">404</div>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Trang không tồn tại
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Rất tiếc, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. 
          Có thể trang này đã bị xóa hoặc đường dẫn không chính xác.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl cursor-pointer"
          >
            <i className="fas fa-home mr-2"></i>
            Về trang chủ
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:text-orange-500 transition-colors cursor-pointer"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Quay lại
          </button>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 mb-4">Hoặc bạn có thể khám phá:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors cursor-pointer"
            >
              <i className="fa-regular fa-newspaper"></i>
              Tin tức
            </button>
            <button
              onClick={() => navigate('/club/info')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors cursor-pointer"
            >
              <i className="fas fa-building mr-2"></i>
              Câu lạc bộ
            </button>
            <button
              onClick={() => navigate('/events')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors cursor-pointer"
            >
              <i className="fas fa-calendar mr-2"></i>
              Sự kiện
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-300 rounded-full opacity-30 blur-2xl"></div>
      </div>
    </div>
  );
}
