import React from 'react';
import type { ApplicationQuestionResponseDto } from '~/cores/api';

interface QuestionCardProps {
  data: ApplicationQuestionResponseDto;
  value: any;
  onChange: (value: any) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ data, value, onChange }) => {
  const handleCheckboxChange = (opt: string) => {
    const currentArray = Array.isArray(value) ? value : [];
    if (currentArray.includes(opt)) {
      const newArray = currentArray.filter((item: string) => item !== opt);
      onChange(newArray);
    } else {
      onChange([...currentArray, opt]);
    }
  };
  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <label className="block text-xl font-bold mb-6 text-gray-800 leading-tight">
        {data.questionText.split('|')[0]}
        {data.isRequired && <span className="text-red-500 ml-1.5">*</span>}
      </label>

      {data.questionType === 'text' && (
        <input 
          type="text"
          placeholder="Nhập câu trả lời của bạn..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="w-full border-b-2 border-gray-100 focus:border-[#FF6B00] outline-none py-3 transition-colors text-lg bg-transparent"
        />
      )}

      {(data.questionType === 'radio' || data.questionType === 'checkbox') && (
        <div className="space-y-3">
          {data.questionText.split('|').slice(1).map((opt, index) => (
            <label 
              key={index} 
              className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-orange-100 hover:bg-orange-50/50 cursor-pointer transition-all group"
            >
              <input
                type={data.questionType === 'radio' ? 'radio' : 'checkbox'}
                name={`q-${data.questionId}`}
                onChange={() => handleCheckboxChange(opt)}
                className="w-5 h-5 accent-[#FF6B00] cursor-pointer"
              />
              <span className="text-gray-700 font-medium group-hover:text-[#FF6B00] transition-colors">
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}

      {data.questionType === 'textarea' && (
        <textarea 
          placeholder="Nhập câu trả lời của bạn..."
          rows={4}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
        />
      )}
    </div>
  );
};

export default QuestionCard;