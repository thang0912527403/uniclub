import React, { useState } from 'react';
import Navbar from './components/navbar';
import FormHeader from './components/formHeader';
import QuestionCard from './components/questionCard';
import ProgressBar from './components/progressBar';
import { useGetQuestionsByFormQuery } from '../../cores/api/applicationApi';

const App: React.FC = () => {
  const { data: questionsData, isLoading, error } = useGetQuestionsByFormQuery(1);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dữ liệu form:', answers);
    alert('Gửi form thành công!');
  };

  if (isLoading) return <div className="text-center py-20">Đang tải câu hỏi...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Đã xảy ra lỗi khi tải dữ liệu.</div>;

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

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-[#FF6B00] hover:bg-[#E56000] text-white px-12 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-orange-200 hover:-translate-y-1"
            >
              Gửi đơn đăng ký
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default App;