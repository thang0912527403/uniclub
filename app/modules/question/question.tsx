import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import Navbar from '../../components/Navbar';
import FormHeader from './components/formHeader';
import QuestionCard from './components/questionCard';
import ProgressBar from './components/progressBar';
import { useGetQuestionsByFormQuery, useSubmitApplicationMutation, useGetApplicationByUserAndFormQuery, useGetFormsByCampaignQuery } from '../../cores/api/applicationApi';
import { useAuth } from '~/components/AuthProvider';
import type { ApplicationAnswerItemDto } from '../../cores/api';

/**
 * Dynamic question/application form page.
 * - Requires the user to be logged in (redirects to /auth/login if not)
 * - formId comes from the URL: /question/:formId
 * - Prevents double-submission (shows "already applied" state)
 */
const QuestionPage: React.FC = () => {
  const { formId: idParam } = useParams<{ formId?: string }>();
  const navigate = useNavigate();

  const idFromUrl = idParam ? Number(idParam) : NaN;

  // We'll try to treat the ID as both a Form ID and a Campaign ID (to find the form)
  // 1. Fetch forms for the ID in case it's a campaign ID
  const { data: campaignForms = [] } = useGetFormsByCampaignQuery(idFromUrl, {
    skip: !idFromUrl || isNaN(idFromUrl),
  });

  // 2. Determine the actual form ID to use:
  // - If it's a valid campaign with forms, use the first form's ID
  // - Otherwise, assume the ID in the URL is the form ID itself
  const actualFormId = campaignForms.length > 0 ? campaignForms[0].formId : idFromUrl;

  const { user: currentUser, isLoading: userLoading } = useAuth();
  const { 
    data: questions = [], 
    isLoading: questionsLoading, 
    error: questionsError 
  } = useGetQuestionsByFormQuery(actualFormId, { skip: !actualFormId || isNaN(actualFormId) });

  const [submitApplication, { isLoading: isSubmitting, error: submitError, isSuccess }] = useSubmitApplicationMutation();

  // Check if user already applied to this form
  const { data: existingApp, isLoading: checkingApp } = useGetApplicationByUserAndFormQuery(
    { userId: currentUser?.userId ?? '', formId: actualFormId },
    { skip: !currentUser?.userId || !actualFormId || isNaN(actualFormId) }
  );

  const [answers, setAnswers] = useState<Record<number, any>>({});

  const handleInputChange = (id: number, value: any) => {
    setAnswers(prev => {
      const isEmpty = value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: value };
    });
  };

  const toAnswerText = (value: any): string => {
    if (value == null) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.userId) return;
    const answerList: ApplicationAnswerItemDto[] = Object.entries(answers)
      .filter(([, v]) => toAnswerText(v).trim() !== '')
      .map(([questionId, value]) => ({
        questionId: Number(questionId),
        answerText: toAnswerText(value).trim(),
      }));
    try {
      await submitApplication({ formId: actualFormId, userId: currentUser.userId, answers: answerList }).unwrap();
    } catch (_) { /* error shown via submitError */ }
  };

  // ── Guard: invalid ID ────────────────────────────────────────────────
  if (!idParam || isNaN(idFromUrl)) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <i className="fa-solid fa-triangle-exclamation text-5xl text-amber-400 mb-4 block" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy biểu mẫu</h2>
          <p className="text-gray-500 mb-6">Đường dẫn không hợp lệ. Vui lòng chọn chiến dịch tuyển dụng trước.</p>
          <Link to="/recruitment-campaigns" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all inline-block">
            <i className="fa-solid fa-arrow-left mr-2" />
            Xem chiến dịch tuyển dụng
          </Link>
        </main>
      </div>
    );
  }

  // ── Guard: loading user ─────────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <i className="fa-solid fa-spinner fa-spin text-3xl mb-3 block" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // ── Guard: must be logged in ────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-100 flex items-center justify-center">
              <i className="fa-solid fa-lock text-orange-500 text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
            <p className="text-gray-500 text-sm mb-6">
              Bạn cần đăng nhập để nộp đơn ứng tuyển. Vui lòng đăng nhập và thử lại.
            </p>
            <Link
              to={`/auth/login?redirect=/question/${actualFormId}`}
              className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all mb-3"
            >
              <i className="fa-solid fa-right-to-bracket mr-2" />
              Đăng nhập
            </Link>
            <Link to="/auth/register" className="block w-full py-3 border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl font-medium transition-all text-sm">
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Guard: loading questions ────────────────────────────────────────────
  if (questionsLoading || checkingApp) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <i className="fa-solid fa-spinner fa-spin text-3xl mb-3 block" />
          <p>Đang tải biểu mẫu...</p>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <i className="fa-solid fa-circle-exclamation text-5xl text-red-400 mb-4 block" />
          <p className="text-red-600 font-medium">Không thể tải biểu mẫu. Vui lòng thử lại.</p>
        </main>
      </div>
    );
  }

  // ── Already applied ─────────────────────────────────────────────────────
  if (existingApp) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-green-500 text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Đã nộp đơn</h2>
            <p className="text-gray-500 text-sm mb-2">
              Bạn đã nộp đơn cho biểu mẫu này.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Nộp lúc: {new Date(existingApp.submissionDate).toLocaleString('vi-VN')}
              {' • '}
              Trạng thái: <span className="font-semibold text-gray-600">{existingApp.status}</span>
            </p>
            <Link to="/my-applications" className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all">
              <i className="fa-solid fa-list mr-2" />
              Xem đơn của tôi
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── No questions ─────────────────────────────────────────────────────────
  if (!questions.length) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <FormHeader title="Thông tin đăng ký" highlight="Thành viên" description="Chào mừng bạn đến với hệ thống tuyển thành viên của UniClubs." />
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
            <p className="font-medium"><i className="fa-solid fa-circle-info mr-2" />Form chưa có câu hỏi.</p>
            <p className="mt-1 text-sm">Quản trị viên cần thêm câu hỏi vào form trước khi bạn có thể gửi đơn.</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fa-solid fa-paper-plane text-green-500 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Nộp đơn thành công!</h2>
            <p className="text-gray-500 text-sm mb-6">Cảm ơn bạn đã ứng tuyển. Chúng tôi sẽ liên hệ sớm.</p>
            <Link to="/my-applications" className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all">
              <i className="fa-solid fa-list mr-2" />
              Xem đơn của tôi
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <FormHeader
          title="Thông tin đăng ký"
          highlight="Thành viên"
          description={`Chào ${currentUser.fullName ?? 'bạn'}! Vui lòng điền đầy đủ các thông tin bên dưới để nộp đơn ứng tuyển.`}
        />
        <ProgressBar
          current={Object.keys(answers).length}
          total={questions.length}
        />
        <form onSubmit={handleSubmit} className="space-y-8 mt-10">
          {questions.map((q) => (
            <QuestionCard
              key={q.questionId}
              data={{
                questionId: q.questionId,
                formId: q.formId,
                questionText: q.questionText,
                isRequired: q.isRequired,
                questionType: q.questionType,
                displayOrder: q.displayOrder,
              }}
              value={answers[q.questionId] || (q.questionType === 'checkbox' ? [] : '')}
              onChange={(val) => handleInputChange(q.questionId, val)}
            />
          ))}

          {submitError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-3">
              <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Gửi đơn thất bại. Vui lòng thử lại.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#FF6B00] hover:bg-[#E56000] disabled:opacity-70 disabled:cursor-not-allowed text-white px-12 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-orange-200 hover:-translate-y-1 flex items-center gap-2"
            >
              {isSubmitting ? (
                <><i className="fa-solid fa-spinner fa-spin" />Đang gửi...</>
              ) : (
                <><i className="fa-solid fa-paper-plane" />Gửi đơn đăng ký</>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default QuestionPage;