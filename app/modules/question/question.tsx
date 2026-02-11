import React, { useState } from 'react';
import Navbar from './components/navbar';
import FormHeader from './components/formHeader';
import QuestionCard from './components/questionCard';
import ProgressBar from './components/progressBar';
import type { Question } from './types';

const questionsData: Question[] = [
  {
    id: 1,
    type: 'text',
    question: 'Họ và tên của bạn là gì?',
    placeholder: 'Nhập câu trả lời...',
    required: true,
  },
  {
    id: 2,
    type: 'radio',
    question: 'Bạn hiện đang là sinh viên năm mấy?',
    options: ['Năm 1', 'Năm 2', 'Năm 3', 'Năm 4', 'Khác'],
    required: true,
  },
  {
    id: 3,
    type: 'checkbox',
    question: 'Lĩnh vực bạn quan tâm là gì? (Chọn nhiều phương án)',
    options: ['Công nghệ', 'Nghệ thuật', 'Thể thao', 'Kỹ năng mềm', 'Tình nguyện'],
    required: false,
  },
];

const App: React.FC = () => {
  // State lưu trữ câu trả lời với ID là key
  const [answers, setAnswers] = useState<Record<number, any>>({});

  const handleInputChange = (id: number, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dữ liệu form:', answers);
    alert('Gửi form thành công!');
  };

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
          total={questionsData.length} 
        />

        <form onSubmit={handleSubmit} className="space-y-8 mt-10">
          {questionsData.map((q) => (
            <QuestionCard 
              key={q.id} 
              data={q} 
              onChange={(val) => handleInputChange(q.id, val)} 
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