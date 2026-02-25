import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useGetClubByIdQuery } from '~/cores/api';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';

export default function ClubDetailModule() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

    const { data: club, isLoading, error } = useGetClubByIdQuery(Number(id));

    return (
        <div className="min-h-screen">
            <SettingButton />

            <Sidebar
                currentPath="/clubs"
                isOpen={isSidebarOpen}
            />

            <HeaderBar
                title="Chi tiết Câu lạc bộ"
                breadcrumb="Pages / Clubs / Detail"
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <main className={`pt-24 p-6 bg-gray-50 dark:bg-gray-900 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'
                }`}>
                {/* Back Button */}
                <button
                    onClick={() => navigate('/clubs')}
                    className="mb-6 cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                    <i className="fas fa-arrow-left"></i>
                    <span>Quay lại danh sách</span>
                </button>

                {/* Loading State */}
                {isLoading && <Loading />}

                {/* Error State */}
                {error && (
                    <Error title="Lỗi khi tải thông tin câu lạc bộ." error={error} />
                )}

                {/* Club Detail */}
                {!isLoading && club && (
                    <div className="space-y-6">
                        {/* Club Header */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                            <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                                {club.coverImageUrl || club.logoUrl ? (
                                    <img
                                        src={club.coverImageUrl || club.logoUrl}
                                        alt={club.clubName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <i className="fas fa-building text-6xl mb-3 opacity-50"></i>
                                            <p className="text-xl font-semibold opacity-75">{club.clubName}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{club.clubName}</h1>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {club.shortName && (
                                                <span className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    {club.shortName}
                                                </span>
                                            )}
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${club.isActive
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-white'
                                                }`}>
                                                {club.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                            </span>
                                            {club.isPublic && (
                                                <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">
                                                    <i className="fas fa-globe mr-1"></i>
                                                    Công khai
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(`/clubs/edit/${id}`)}
                                            className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            <i className="fas fa-edit mr-2"></i>
                                            Chỉnh sửa
                                        </button>
                                        <button className="cursor-pointer px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <i className="fas fa-share mr-2"></i>
                                            Chia sẻ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-users text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Thành viên</p>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{club.memberCount}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-calendar text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Sự kiện</p>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">12</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-clock text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ngày thành lập</p>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                            {new Date(club.foundedDate).toLocaleDateString('vi-VN')}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-eye text-white text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Trạng thái</p>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                            {club.isPublic ? 'Công khai' : 'Riêng tư'}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                <i className="fas fa-info-circle mr-2"></i>
                                Mô tả
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                {club.description}
                            </p>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                <i className="fas fa-address-card mr-2"></i>
                                Thông tin liên hệ
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {club.email && (
                                    <div className="flex items-center gap-3">
                                        <i className="fas fa-envelope text-gray-500 dark:text-gray-400"></i>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                            <p className="text-gray-900 dark:text-white">{club.email}</p>
                                        </div>
                                    </div>
                                )}
                                {club.phoneNumber && (
                                    <div className="flex items-center gap-3">
                                        <i className="fas fa-phone text-gray-500 dark:text-gray-400"></i>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Điện thoại</p>
                                            <p className="text-gray-900 dark:text-white">{club.phoneNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {club.address && (
                                    <div className="flex items-center gap-3">
                                        <i className="fas fa-map-marker-alt text-gray-500 dark:text-gray-400"></i>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Địa chỉ</p>
                                            <p className="text-gray-900 dark:text-white">{club.address}</p>
                                        </div>
                                    </div>
                                )}
                                {club.websiteUrl && (
                                    <div className="flex items-center gap-3">
                                        <i className="fas fa-globe text-gray-500 dark:text-gray-400"></i>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                                            <a href={club.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                                                {club.websiteUrl}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {club.facebookUrl && (
                                    <div className="flex items-center gap-3">
                                        <i className="fab fa-facebook text-gray-500 dark:text-gray-400"></i>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Facebook</p>
                                            <a href={club.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                                                Facebook Page
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Members Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    <i className="fas fa-users mr-2"></i>
                                    Thành viên nổi bật
                                </h2>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                U{i}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">User {i}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Member</p>
                                            </div>
                                            <button className="text-blue-500 hover:text-blue-600">
                                                <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button className="w-full text-center text-blue-500 hover:text-blue-600 font-semibold py-2">
                                        Xem tất cả thành viên →
                                    </button>
                                </div>
                            </div>

                            {/* Recent Activities */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    <i className="fas fa-history mr-2"></i>
                                    Hoạt động gần đây
                                </h2>
                                <div className="space-y-3">
                                    {[
                                        { icon: 'fa-calendar', text: 'Sự kiện mới được tạo', time: '2 giờ trước' },
                                        { icon: 'fa-user-plus', text: '5 thành viên mới tham gia', time: '1 ngày trước' },
                                        { icon: 'fa-image', text: 'Cập nhật ảnh bìa', time: '3 ngày trước' },
                                    ].map((activity, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                                <i className={`fas ${activity.icon} text-sm text-blue-500`}></i>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900 dark:text-white">{activity.text}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full text-center text-blue-500 hover:text-blue-600 font-semibold py-2">
                                        Xem tất cả hoạt động →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
