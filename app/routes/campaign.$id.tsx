import { useParams, Link } from 'react-router';
import { useGetRecruitmentCampaignQuery } from '~/cores/api';
import type { RecruitmentCampaign } from '~/cores/api';
import Navbar from '~/modules/home/components/Navbar';
import Footer from '~/modules/home/components/Footer';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const campaignId = Number(id);
  const isPlaceholderId = campaignId <= 0;

  const { data: apiCampaign, isLoading, error } = useGetRecruitmentCampaignQuery(campaignId, {
    skip: isPlaceholderId,
  });

  const placeholderCampaigns: RecruitmentCampaign[] = [
    {
      campaignId: 0,
      clubId: 0,
      campaignName: 'Chiến dịch tuyển thành viên CLB Công nghệ',
      linkCampaign: '',
      description:
        'Câu lạc bộ Công nghệ đang tuyển thành viên cho năm học mới. Bạn sẽ được tham gia các buổi workshop, dự án và kết nối với cộng đồng đam mê lập trình.',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'active',
      imageUrl: '',
      content:
        'Yêu cầu:\n• Sinh viên các khoa CNTT, Toán – Tin.\n• Có đam mê công nghệ, sẵn sàng học hỏi.\n• Tham gia đầy đủ các buổi sinh hoạt định kỳ.\n\nQuyền lợi:\n• Được đào tạo kỹ năng lập trình, làm dự án thực tế.\n• Tham gia sự kiện, hackathon do CLB tổ chức.',
      createdAt: '',
    },
    {
      campaignId: -1,
      clubId: 0,
      campaignName: 'Tuyển tình nguyện viên sự kiện',
      linkCampaign: '',
      description:
        'Ban tổ chức sự kiện của trường cần tình nguyện viên hỗ trợ các chương trình trong năm. Cơ hội rèn luyện kỹ năng tổ chức và làm việc nhóm.',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'active',
      imageUrl: '',
      content:
        'Công việc:\n• Hỗ trợ tổ chức sự kiện (hội trường, âm thanh, hậu cần).\n• Điều phối khách mời và người tham gia.\n• Quản lý tài liệu, vật phẩm sự kiện.\n\nThời gian: Linh hoạt theo từng sự kiện, ưu tiên cuối tuần.',
      createdAt: '',
    },
    {
      campaignId: -2,
      clubId: 0,
      campaignName: 'Chiến dịch kết nối sinh viên',
      linkCampaign: '',
      description:
        'Chương trình kết nối sinh viên với các câu lạc bộ và cơ hội phát triển bản thân. Đăng ký để nhận tư vấn và tham gia các hoạt động phù hợp với bạn.',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'active',
      imageUrl: '',
      content:
        'Nội dung:\n• Khảo sát sở thích và định hướng của sinh viên.\n• Giới thiệu các CLB phù hợp.\n• Tổ chức Ngày hội CLB, giao lưu kết nối.\n\nHãy điền form ứng tuyển để chúng tôi hiểu bạn hơn và gợi ý câu lạc bộ phù hợp.',
      createdAt: '',
    },
  ];

  const placeholder =
    isPlaceholderId && campaignId >= -2
      ? placeholderCampaigns[campaignId === 0 ? 0 : campaignId === -1 ? 1 : 2]
      : null;
  const campaign = isPlaceholderId ? placeholder : apiCampaign;

  if (!isPlaceholderId && isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-20 text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-orange-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải chiến dịch...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign || (!isPlaceholderId && error)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-20 text-center">
          <i className="fas fa-exclamation-circle text-5xl text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy chiến dịch</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Chiến dịch không tồn tại hoặc đã bị ẩn.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
          >
            <i className="fas fa-arrow-left" /> Về trang chủ
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isActive = campaign.status?.toLowerCase() === 'active';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 mb-8 transition-colors"
        >
          <i className="fas fa-arrow-left" /> Trang chủ
        </Link>

        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          {/* Banner */}
          <div className="relative h-64 sm:h-80 overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 dark:from-gray-700 dark:to-gray-600">
            {campaign.imageUrl ? (
              <img
                src={campaign.imageUrl}
                alt={campaign.campaignName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-bullhorn text-8xl text-orange-300 dark:text-orange-500/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${
                  isActive ? 'bg-green-500' : 'bg-gray-500'
                }`}
              >
                {isActive ? 'Đang mở' : campaign.status}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold">{campaign.campaignName}</h1>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {campaign.description && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Mô tả</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{campaign.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i className="fas fa-calendar-alt text-orange-500 w-5" />
                <span>
                  Bắt đầu: {new Date(campaign.startDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i className="fas fa-calendar-check text-orange-500 w-5" />
                <span>
                  Kết thúc: {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {campaign.content && (
              <div className="prose prose-gray dark:prose-invert max-w-none mb-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nội dung chi tiết</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {campaign.content}
                </p>
              </div>
            )}

            {campaign.linkCampaign && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={campaign.linkCampaign}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
                >
                  Liên kết chiến dịch <i className="fas fa-external-link-alt text-sm" />
                </a>
              </div>
            )}

            {isActive && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Bấm nút bên dưới để chuyển đến trang trả lời câu hỏi ứng tuyển.
                </p>
                <Link
                  to="/question"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  <i className="fas fa-file-alt" /> Ứng tuyển
                </Link>
              </div>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
