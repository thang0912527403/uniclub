import React, { useState } from 'react';
import Navbar from './components/navbar';
import FormHeader from './components/formHeader';
import QuestionCard from './components/questionCard';
import ProgressBar from './components/progressBar';
import { useGetQuestionsByFormQuery, useSubmitApplicationMutation } from '../../cores/api/applicationApi';
import { useGetCurrentUserQuery } from '../../cores/api';
import type { ApplicationAnswerItemDto } from '../../cores/api';

const FORM_ID = 1;

const App: React.FC = () => {
  const { data: questionsData, isLoading, error } = useGetQuestionsByFormQuery(FORM_ID);
  const { data: currentUser } = useGetCurrentUserQuery();
  const [submitApplication, { isLoading: isSubmitting, error: submitError, isSuccess }] = useSubmitApplicationMutation();

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
    if (!currentUser?.userId) {
      return; // UI hiển thị "Vui lòng đăng nhập" bên dưới
    }
    const answerList: ApplicationAnswerItemDto[] = Object.entries(answers)
      .filter(([, v]) => toAnswerText(v).trim() !== '')
      .map(([questionId, value]) => ({
        questionId: Number(questionId),
        answerText: toAnswerText(value) || undefined,
      }));
    try {
      await submitApplication({
        formId: FORM_ID,
        userId: currentUser.userId,
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

          {!currentUser?.userId && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Vui lòng đăng nhập để gửi đơn đăng ký.
            </div>
          )}
          {submitError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {(submitError as { data?: { message?: string } })?.data?.message ?? 'Gửi đơn thất bại. Vui lòng thử lại.'}
            </div>
          )}
          {isSuccess && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
              Gửi đơn đăng ký thành công.
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !currentUser?.userId}
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