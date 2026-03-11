import { useNavigate, Link } from 'react-router';
import { useGetUserAllClubsQuery } from '~/cores/api/userApi';
import { getUserId, setClubId } from '~/utils/auth';
import { SettingButton } from '~/components/SettingButton';
import type { Club } from '~/cores/api/types';

function ClubRow({ club }: { club: Club }) {
  const navigate = useNavigate();

  const handleSelect = () => {
    setClubId(club.clubId);
    navigate('/dashboard');
  };

  const isActive = club.status === 'Active' || club.status === 'ACTIVE';

  return (
    <div
      onClick={handleSelect}
      className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-200"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <span className="text-white font-bold text-lg">
            {club.clubName[0].toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {club.clubName}
          </h3>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
            {isActive ? 'Hoạt động' : club.status}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          {club.shortName && (
            <span className="flex items-center gap-1">
              <i className="fas fa-tag text-blue-400"></i>
              {club.shortName}
            </span>
          )}
          {club.address && (
            <span className="flex items-center gap-1">
              <i className="fas fa-map-marker-alt text-gray-400"></i>
              {club.address}
            </span>
          )}
          {club.isPublic && (
            <span className="flex items-center gap-1">
              <i className="fas fa-globe text-gray-400"></i>
              Công khai
            </span>
          )}
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
        <i className="fas fa-chevron-right text-xs text-gray-400 group-hover:text-white transition-colors"></i>
      </div>
    </div>
  );
}

export default function MyClubsModule() {
  const userId = getUserId();
  const { data: clubs, isLoading, error } = useGetUserAllClubsQuery(userId, {
    skip: !userId,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">UniClubs</span>
          </Link>
          <Link to="/home" className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <i className="fas fa-arrow-left mr-1.5"></i>Trang chủ
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-building text-blue-600 dark:text-blue-400 text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Câu lạc bộ của tôi</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Chọn câu lạc bộ bạn muốn quản lý</p>
          </div>

          {isLoading && (
            <div className="text-center py-16">
              <i className="fas fa-circle-notch fa-spin text-3xl text-blue-500 mb-3"></i>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Đang tải...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Không thể tải dữ liệu</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vui lòng thử lại sau</p>
            </div>
          )}

          {!isLoading && clubs && clubs.length > 0 && (
            <div className="flex flex-col gap-3">
              {clubs.map((club) => (
                <ClubRow key={club.clubId} club={club} />
              ))}
            </div>
          )}

          {!isLoading && clubs && clubs.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-inbox text-gray-400 text-xl"></i>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Chưa tham gia câu lạc bộ nào</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hãy tham gia một câu lạc bộ để bắt đầu</p>
              <Link
                to="/public/clubs"
                className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                <i className="fas fa-search"></i> Khám phá câu lạc bộ
              </Link>
            </div>
          )}
        </div>
      </div>

      <SettingButton />
    </div>
  );
}
