import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  useGetRecruitmentCampaignQuery,
  useGetFormsByCampaignQuery,
} from "~/cores/api";
import Navbar from "../components/Navbar";
import Footer from "~/modules/home/components/Footer";
import { useClubRole } from "~/hooks/useClubRole";
import { getUserId } from "~/utils/auth";
import { CreatePostModal } from "~/modules/clubs/posts/clubpost";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const campaignId = Number(id) || 0;
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  const { can: canClub } = useClubRole();
  const userId = getUserId() ?? "";

  const {
    data: campaign,
    isLoading,
    error,
  } = useGetRecruitmentCampaignQuery({ clubId: 0, id: campaignId }, {
    skip: !campaignId,
  });

  const clubId = campaign?.clubId ?? 0;
  const { data: forms = [] } = useGetFormsByCampaignQuery(
    { clubId, campaignId },
    { skip: !campaignId || !clubId },
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-20 text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-orange-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải chiến dịch...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign || error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-20 text-center">
          <i className="fas fa-exclamation-circle text-5xl text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Không tìm thấy chiến dịch
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Chiến dịch không tồn tại hoặc đã bị ẩn.
          </p>
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

  const isActive = campaign.status?.toLowerCase() === "open";
  const firstFormId = forms.length > 0 ? forms[0].formId : null;

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
                  isActive ? "bg-green-500" : "bg-gray-500"
                }`}
              >
                {isActive ? "OPEN" : campaign.status}
              </span>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    {campaign.campaignName}
                  </h1>
                </div>
                {isActive && (
                  <Link
                    to={`/campaign/${campaignId}/application-form`}
                    className="flex-shrink-0 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <i className="fas fa-paper-plane" /> Ứng tuyển ngay
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {campaign.description && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Mô tả
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {campaign.description}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i className="fas fa-calendar-alt text-orange-500 w-5" />
                <span>
                  Bắt đầu:{" "}
                  {new Date(campaign.startDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i className="fas fa-calendar-check text-orange-500 w-5" />
                <span>
                  Kết thúc:{" "}
                  {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>

            {campaign.content && (
              <div className="prose prose-gray dark:prose-invert max-w-none mb-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Nội dung chi tiết
                </h2>
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
                  Liên kết chiến dịch{" "}
                  <i className="fas fa-external-link-alt text-sm" />
                </a>
              </div>
            )}

            {canClub("viewpost", clubId) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowCreatePostModal(true)}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-pen" /> Tạo bài đăng cho chiến dịch này
                </button>
              </div>
            )}

            {isActive && firstFormId && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Bấm nút bên dưới để chuyển đến trang trả lời câu hỏi ứng
                  tuyển.
                </p>
                <Link
                  to={`/campaign/${campaignId}/application-form`}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  <i className="fas fa-file-alt" /> Ứng tuyển ngay
                </Link>
              </div>
            )}

            {isActive && !firstFormId && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-3">
                  <i className="fas fa-info-circle mt-0.5" />
                  <p className="font-medium text-sm">
                    Chiến dịch này đang mở nhưng chưa có biểu mẫu ứng tuyển nào.
                    Vui lòng quay lại sau.
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
      </main>

      {showCreatePostModal && clubId > 0 && (
        <CreatePostModal
          onClose={() => setShowCreatePostModal(false)}
          clubId={clubId}
          userId={userId}
          campaignId={campaignId}
        />
      )}

      <Footer />
    </div>
  );
}
