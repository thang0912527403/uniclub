import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useCreateClubRequestMutation, useCheckPendingRequestQuery, type CreateClubRequestDto } from '~/cores/api/clubRequestApi';
import { useGetManagedClubsQuery, useGetUserRoleQuery } from '~/cores/api/userApi';
import { getUserId } from '~/utils/auth';
import { Loading } from '~/components/Loading';

// ─── TermsSection ────────────────────────────────────────────────────────────

interface TermsSectionProps {
    number: number;
    title: string;
    icon: string;
    items?: string[];
    body?: string;
    highlight?: string;
}

function TermsSection({ number, title, icon, items, body, highlight }: TermsSectionProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <i className={`fa-solid ${icon} text-orange-500 text-sm`} />
                </div>
                <h2 className="text-sm font-bold text-zinc-800">
                    <span className="text-orange-500 mr-1">Điều {number}.</span>
                    {title}
                </h2>
            </div>
            {body && (
                <p className="text-sm text-zinc-600 leading-relaxed pl-11">{body}</p>
            )}
            {items && items.length > 0 && (
                <ul className="pl-11 space-y-1.5">
                    {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            )}
            {highlight && (
                <div className="ml-11 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-orange-800 leading-relaxed">{highlight}</p>
                </div>
            )}
        </div>
    );
}

// ─── TermsStep ───────────────────────────────────────────────────────────────

interface TermsStepProps {
    onAccept: () => void;
}

function TermsStep({ onAccept }: TermsStepProps) {
    const [checked, setChecked] = useState(false);

    return (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden border border-zinc-200 flex flex-col max-h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-white flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                        <i className="fa-solid fa-file-contract text-xl" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Điều khoản thành lập Câu lạc bộ</h1>
                        <p className="text-orange-50/80 text-xs">Phiên bản 1.0 — Vui lòng đọc kỹ trước khi tiếp tục</p>
                    </div>
                </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 border-b border-zinc-100">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                    <i className="fa-solid fa-circle-info text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        Tài liệu này gồm <strong>10 điều khoản</strong> bắt buộc áp dụng cho mọi câu lạc bộ trên hệ thống.
                        Cuộn xuống để đọc toàn bộ nội dung trước khi đồng ý.
                    </p>
                </div>

                <TermsSection
                    number={1}
                    title="Điều kiện đăng ký"
                    icon="fa-user-check"
                    items={[
                        'Người đăng ký phải có tài khoản hợp lệ trên nền tảng và đủ 18 tuổi trở lên.',
                        'Mỗi tài khoản chỉ được đứng tên thành lập 1 câu lạc bộ tại một thời điểm. Nếu muốn thành lập câu lạc bộ mới, bạn phải giải thể hoặc chuyển nhượng quyền quản lý câu lạc bộ hiện tại trước.',
                        'Bạn có thể tham gia không giới hạn số câu lạc bộ với tư cách thành viên.',
                        'Tên câu lạc bộ phải chưa tồn tại trên nền tảng.',
                    ]}
                />

                <TermsSection
                    number={2}
                    title="Tính chính xác của thông tin"
                    icon="fa-pen-to-square"
                    items={[
                        'Tên, mô tả, logo, ảnh bìa và thông tin liên hệ phải phản ánh đúng bản chất và mục đích hoạt động của câu lạc bộ.',
                        'Nghiêm cấm mạo danh thương hiệu, cá nhân, tổ chức hoặc bất kỳ thực thể nào khác dưới tên câu lạc bộ mà không có bằng chứng ủy quyền hợp lệ.',
                        'Người đứng tên thành lập chịu toàn bộ trách nhiệm pháp lý nếu thông tin được xác định là giả mạo hoặc vi phạm quyền sở hữu trí tuệ của bên thứ ba.',
                    ]}
                />

                <TermsSection
                    number={3}
                    title="Phạm vi hoạt động được phép"
                    icon="fa-list-check"
                    items={[
                        'Nền tảng không giới hạn lĩnh vực hoạt động, miễn là hợp pháp.',
                        'Nghiêm cấm: kinh doanh đa cấp, lừa đảo tài chính, cờ bạc dưới bất kỳ hình thức nào.',
                        'Nghiêm cấm: tuyên truyền tư tưởng cực đoan, kích động thù hận về sắc tộc, tôn giáo, giới tính.',
                        'Nghiêm cấm: thu thập, khai thác thông tin cá nhân của thành viên ngoài mục đích vận hành câu lạc bộ.',
                        'Nghiêm cấm: bất kỳ hành vi nào vi phạm pháp luật hiện hành của nước CHXHCN Việt Nam.',
                    ]}
                />

                <TermsSection
                    number={4}
                    title="Trách nhiệm của người quản lý câu lạc bộ"
                    icon="fa-shield-halved"
                    items={[
                        'Duy trì thông tin câu lạc bộ chính xác và cập nhật liên tục.',
                        'Quản lý thành viên công bằng, không phân biệt đối xử dưới bất kỳ hình thức nào.',
                        'Đảm bảo các hoạt động và sự kiện được tổ chức an toàn, hợp pháp.',
                        'Thông báo rõ ràng cho thành viên về mọi khoản phí trước khi họ tham gia.',
                        'Không ép buộc thành viên đóng phí hoặc mua sản phẩm/dịch vụ ngoài những gì đã công bố.',
                        'Không chia sẻ, bán hoặc sử dụng thông tin cá nhân của thành viên cho mục đích ngoài phạm vi hoạt động.',
                    ]}
                    highlight="Tranh chấp nội bộ giữa các thành viên thuộc trách nhiệm của Quản lý câu lạc bộ giải quyết. Nền tảng không đóng vai trò trọng tài trong các mâu thuẫn nội bộ."
                />

                <TermsSection
                    number={5}
                    title="Chính sách nội dung"
                    icon="fa-flag"
                    items={[
                        'Nghiêm cấm nội dung bạo lực, khiêu dâm hoặc bất kỳ nội dung nào gây hại cho người dưới 18 tuổi.',
                        'Nghiêm cấm nội dung xúc phạm, bôi nhọ danh dự cá nhân hoặc tổ chức khác.',
                        'Nghiêm cấm thông tin sai lệch, tin giả có khả năng gây hoang mang hoặc ảnh hưởng tiêu cực đến cộng đồng.',
                        'Nghiêm cấm spam, quảng cáo hoặc nội dung thương mại không được sự đồng ý của thành viên.',
                        'Nền tảng có quyền gỡ bỏ bất kỳ nội dung vi phạm mà không cần thông báo trước.',
                    ]}
                />

                <TermsSection
                    number={6}
                    title="Bảo vệ dữ liệu thành viên"
                    icon="fa-lock"
                    items={[
                        'Thông tin cá nhân của thành viên chỉ được sử dụng đúng mục đích vận hành câu lạc bộ.',
                        'Câu lạc bộ ở chế độ "Công khai" sẽ hiển thị với toàn bộ người dùng nền tảng.',
                        'Khi thành viên rời câu lạc bộ, thông tin cá nhân của họ phải được xóa khỏi mọi danh sách nội bộ trong vòng 7 ngày.',
                    ]}
                    highlight="Không được tiết lộ hoặc chuyển giao thông tin cá nhân của thành viên cho bên thứ ba dưới bất kỳ hình thức nào."
                />

                <TermsSection
                    number={7}
                    title="Đình chỉ và giải thể câu lạc bộ"
                    icon="fa-circle-xmark"
                    items={[
                        'Vi phạm bất kỳ điều khoản nào trong tài liệu này.',
                        'Không có bất kỳ hoạt động nào trong 12 tháng liên tiếp.',
                        'Có khiếu nại từ thành viên được xác minh là có căn cứ.',
                        'Có yêu cầu từ cơ quan pháp luật có thẩm quyền.',
                    ]}
                    highlight="Trừ trường hợp vi phạm nghiêm trọng, nền tảng sẽ gửi 1 thông báo cảnh cáo trước. Quản lý có 7 ngày làm việc để phản hồi. Sau thời hạn này, toàn bộ dữ liệu sẽ bị xóa vĩnh viễn sau 30 ngày và không thể khôi phục."
                />

                <TermsSection
                    number={8}
                    title="Quyền sở hữu nội dung"
                    icon="fa-copyright"
                    body="Nội dung do câu lạc bộ tạo ra thuộc quyền sở hữu của người tạo ra. Bằng cách đăng tải lên nền tảng, bạn cấp cho nền tảng quyền sử dụng phi độc quyền, miễn phí để hiển thị và lưu trữ nội dung phục vụ mục đích vận hành dịch vụ. Quyền sử dụng chấm dứt ngay khi nội dung hoặc câu lạc bộ bị xóa khỏi nền tảng."
                />

                <TermsSection
                    number={9}
                    title="Thay đổi điều khoản"
                    icon="fa-rotate"
                    body="Nền tảng có quyền cập nhật điều khoản này bất kỳ lúc nào. Mọi thay đổi sẽ được thông báo qua email ít nhất 14 ngày trước khi có hiệu lực. Việc tiếp tục duy trì câu lạc bộ sau ngày hiệu lực đồng nghĩa với việc chấp nhận phiên bản điều khoản mới."
                />

                <TermsSection
                    number={10}
                    title="Liên hệ & khiếu nại"
                    icon="fa-envelope"
                    highlight="Email hỗ trợ: support@unic.vn — Mọi khiếu nại về điều khoản hoặc hoạt động câu lạc bộ vui lòng gửi qua email để được xử lý trong 3–5 ngày làm việc."
                />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-zinc-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        className="w-5 h-5 rounded accent-orange-500 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm font-semibold text-zinc-700 group-hover:text-orange-500 transition-colors">
                        Tôi đã đọc và đồng ý với tất cả điều khoản trên
                    </span>
                </label>
                <button
                    type="button"
                    disabled={!checked}
                    onClick={onAccept}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                >
                    <i className="fa-solid fa-arrow-right" />
                    Tiếp tục đăng ký
                </button>
            </div>
        </div>
    );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
    clubName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

function ConfirmModal({ clubName, onConfirm, onCancel, isSubmitting }: ConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500">
                        <i className="fa-solid fa-paper-plane text-2xl" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900">Xác nhận gửi yêu cầu</h3>
                        <p className="text-sm text-zinc-500">CLB: {clubName}</p>
                    </div>
                </div>
                <p className="text-zinc-600 mb-8 leading-relaxed">
                    Bạn có chắc muốn gửi yêu cầu thành lập câu lạc bộ <span className="font-semibold text-orange-500">"{clubName}"</span>? Yêu cầu sẽ được xét duyệt trong 3–5 ngày làm việc.
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50 transition-all cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 disabled:opacity-50 cursor-pointer"
                    >
                        {isSubmitting && <i className="fa-solid fa-spinner fa-spin" />}
                        Xác nhận gửi
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── SuccessModal ─────────────────────────────────────────────────────────────

interface SuccessModalProps {
    clubName: string;
    onClose: () => void;
}

function SuccessModal({ clubName, onClose }: SuccessModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mx-auto mb-4">
                    <i className="fa-solid fa-check text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Gửi yêu cầu thành công!</h3>
                <p className="text-zinc-500 text-sm mb-6">
                    Yêu cầu thành lập câu lạc bộ <span className="font-semibold text-orange-500">"{clubName}"</span> đã được gửi. Chúng tôi sẽ xét duyệt và thông báo kết quả sớm nhất.
                </p>
                <button
                    onClick={onClose}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all cursor-pointer"
                >
                    Về trang câu lạc bộ của tôi
                </button>
            </div>
        </div>
    );
}

// ─── CreateClubRequestPage ────────────────────────────────────────────────────

const CreateClubRequestPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ clubName: '', description: '', reason: '' });
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [createRequest] = useCreateClubRequestMutation();
    const currentUserId = getUserId();

    const { data: hasPendingRequest, isLoading: pendingLoading } = useCheckPendingRequestQuery(currentUserId, { skip: !currentUserId });
    const { data: managedClubs, isLoading: managedLoading } = useGetManagedClubsQuery(currentUserId);
    const { data: userRoles, isLoading: rolesLoading } = useGetUserRoleQuery(currentUserId);
    const isAdmin = userRoles?.includes('Admin') ?? false;

    if (pendingLoading || managedLoading || rolesLoading) return <Loading />;
    if (!showSuccess && (hasPendingRequest || (managedClubs?.length ?? 0) > 0 || isAdmin)) return <Navigate to="/403" />;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!termsAccepted) return;
        if (!formData.clubName.trim()) return;
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        const data: CreateClubRequestDto = {
            userId: currentUserId,
            clubName: formData.clubName,
            description: formData.description,
            reason: formData.reason,
        };
        try {
            await createRequest(data).unwrap();
            setShowConfirm(false);
            setShowSuccess(true);
        } catch (error) {
            console.error(error);
            setShowConfirm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        navigate('/manage-clubs');
    };

    return (
        <div className="min-h-screen bg-zinc-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <button
                    className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-orange-500 transition-colors"
                    onClick={() => window.history.back()}
                >
                    <i className="fa-solid fa-arrow-left" />
                    Quay lại danh sách
                </button>

                {!termsAccepted ? (
                    <TermsStep onAccept={() => setTermsAccepted(true)} />
                ) : (
                    <>
                        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden border border-zinc-200">
                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <i className="fa-solid fa-users-plus text-2xl" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold">Đăng ký thành lập Câu lạc bộ</h1>
                                        <p className="text-orange-50/80 text-xs">Hãy chia sẻ ý tưởng của bạn để xây dựng cộng đồng</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">
                                        Tên câu lạc bộ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                            <i className="fa-solid fa-quote-left" />
                                        </span>
                                        <input
                                            type="text"
                                            name="clubName"
                                            required
                                            value={formData.clubName}
                                            onChange={handleChange}
                                            placeholder="Ví dụ: CLB Lập trình Sáng tạo"
                                            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">
                                        Mô tả ngắn gọn
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Câu lạc bộ hoạt động về lĩnh vực gì? Mục tiêu chính là gì?..."
                                        className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">
                                        Lý do muốn thành lập CLB
                                    </label>
                                    <textarea
                                        name="reason"
                                        rows={3}
                                        value={formData.reason}
                                        onChange={handleChange}
                                        placeholder="Tại sao trường/tổ chức cần có câu lạc bộ này?..."
                                        className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="px-5 py-2.5 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!formData.clubName.trim()}
                                        className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-paper-plane" />
                                        Gửi yêu cầu tạo CLB
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-orange-50 p-3 rounded-2xl flex items-start gap-3">
                                <i className="fa-solid fa-circle-info text-orange-500 mt-1" />
                                <p className="text-xs text-orange-800">Yêu cầu sẽ được xét duyệt trong 3-5 ngày làm việc.</p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-2xl flex items-start gap-3">
                                <i className="fa-solid fa-shield-check text-amber-500 mt-1" />
                                <p className="text-xs text-amber-800">Đảm bảo tên câu lạc bộ không vi phạm quy chuẩn văn hóa.</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {showConfirm && (
                <ConfirmModal
                    clubName={formData.clubName}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirm(false)}
                    isSubmitting={isSubmitting}
                />
            )}

            {showSuccess && (
                <SuccessModal
                    clubName={formData.clubName}
                    onClose={handleSuccessClose}
                />
            )}
        </div>
    );
};

export default CreateClubRequestPage;
