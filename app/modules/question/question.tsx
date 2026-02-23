import React, { useState } from 'react';
import Navbar from './components/navbar';
import FormHeader from './components/formHeader';
import QuestionCard from './components/questionCard';
import ProgressBar from './components/progressBar';
import { useGetQuestionsByFormQuery, useSubmitApplicationMutation } from '../../cores/api/applicationApi';
import { useGetCurrentUserQuery } from '../../cores/api';
import type { ApplicationAnswerItemDto } from '../../cores/api';

const FORM_ID = 1;
/** UserId dùng khi chưa đăng nhập (để test). Backend cần có user này trong DB nếu dùng. */
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';

function getSubmitErrorMessage(error: unknown): { message: string; hint?: string } {
  const err = error as { status?: number | string; data?: Record<string, unknown> };
  const status = err?.status;
  const data = err?.data;
  let message = 'Gửi đơn thất bại. Vui lòng thử lại.';
  let hint: string | undefined;

  if (status === 'PARSING_ERROR') {
    message = 'Backend trả về dữ liệu không phải JSON (có thể là trang lỗi HTML).';
    hint = 'Kiểm tra: (1) API đang chạy đúng URL chưa (https://localhost:7237). (2) Endpoint POST /Application/submit có trả về JSON khi thành công hoặc khi lỗi (4xx/5xx cũng nên trả JSON, không trả trang HTML).';
    return { message, hint };
  }

  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') message = data.message;
    else if (typeof data.title === 'string') message = data.title;
    else if (Array.isArray(data.errors)) {
      const parts = (data.errors as unknown[]).map((e) => (typeof e === 'string' ? e : (e as Record<string, string>)?.message ?? String(e)));
      message = parts.length ? parts.join('. ') : message;
    }
  }

  if (status === 401) hint = 'Bạn cần đăng nhập để nộp đơn (hoặc kiểm tra backend có cho phép userId test).';
  else if (status === 403) hint = 'Bạn không có quyền nộp đơn cho form này.';
  else if (status === 404) hint = 'Form không tồn tại hoặc đã bị xóa. Kiểm tra FORM_ID và backend.';
  else if (status === 400) hint = 'Dữ liệu không hợp lệ (userId, formId hoặc answers). Kiểm tra backend có user test trong DB.';

  return { message, hint };
}

function SubmitErrorBox({ error }: { error: unknown }) {
  const { message, hint } = getSubmitErrorMessage(error);
  const err = error as { status?: number | string };
  const showStatus = err?.status != null && err.status !== 'PARSING_ERROR';
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
      <p className="font-medium">{message}</p>
      {showStatus && (
        <p className="mt-1 text-sm opacity-90">Mã HTTP: {String(err.status)}</p>
      )}
      {err?.status === 'PARSING_ERROR' && (
        <p className="mt-1 text-sm opacity-90">Mã lỗi: PARSING_ERROR</p>
      )}
      {hint && <p className="mt-2 text-sm border-t border-red-200 pt-2">{hint}</p>}
    </div>
  );
}

const App: React.FC = () => {
  const { data: questionsData, isLoading, error } = useGetQuestionsByFormQuery(FORM_ID);
  const { data: currentUser } = useGetCurrentUserQuery();
  const [submitApplication, { isLoading: isSubmitting, error: submitError, isSuccess }] = useSubmitApplicationMutation();
  const userId = currentUser?.userId ?? TEST_USER_ID;
  const isTestMode = !currentUser?.userId;

  const [answers, setAnswers] = useState<Record<number, any>>({});

  const handleInputChange = (id: number, value: any) => {
    setAnswers(prev => {
      const isEmpty = value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        const newAnswers = { ...prev };
        delete newAnswers[id];
        return newAnswers;
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
    const answerList: ApplicationAnswerItemDto[] = Object.entries(answers)
      .filter(([, v]) => toAnswerText(v).trim() !== '')
      .map(([questionId, value]) => ({
        questionId: Number(questionId),
        answerText: toAnswerText(value).trim() || '',
      }));
    try {
      await submitApplication({
        formId: FORM_ID,
        userId,
        answers: answerList,
      }).unwrap();
    } catch (_) {
      // submitError từ mutation để hiển thị bên dưới
    }
  };

  if (isLoading) return <div className="text-center py-20">Đang tải câu hỏi...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Đã xảy ra lỗi khi tải dữ liệu.</div>;
  if (!questionsData?.length) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <FormHeader
            title="Thông tin đăng ký"
            highlight="Thành viên"
            description="Chào mừng bạn đến với hệ thống tuyển thành viên của UniClubs."
          />
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
            <p className="font-medium">Form chưa có câu hỏi.</p>
            <p className="mt-1 text-sm">Quản trị viên cần thêm câu hỏi vào form trước khi bạn có thể gửi đơn.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-16">
        <FormHeader
          title="Thông tin đăng ký"
          highlight="Thành viên"
          description="Chào mừng bạn đến với hệ thống tuyển thành viên của UniClubs. Vui lòng điền đầy đủ các thông tin bên dưới."
        />

        <ProgressBar
          current={Object.keys(answers).length}
          total={questionsData?.length || 0}
        />

        <form onSubmit={handleSubmit} className="space-y-8 mt-10">
          {questionsData?.map((q) => (
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

          {isTestMode && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 text-sm">
              Đang dùng chế độ test (chưa đăng nhập). Đơn sẽ gửi với tài khoản test.
            </div>
          )}
          {submitError && (
            <SubmitErrorBox error={submitError} />
          )}
          {isSuccess && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
              Gửi đơn đăng ký thành công.
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#FF6B00] hover:bg-[#E56000] disabled:opacity-70 disabled:cursor-not-allowed text-white px-12 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-orange-200 hover:-translate-y-1"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default App;