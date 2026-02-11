import React from 'react';
import type { Question } from '../types';

interface QuestionCardProps {
  data: Question;
  onChange: (value: any) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ data, onChange }) => {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <label className="block text-xl font-bold mb-6 text-gray-800 leading-tight">
        {data.question}
        {data.required && <span className="text-red-500 ml-1.5">*</span>}
      </label>

      {/* Input dạng Text */}
      {data.type === 'text' && (
        <input 
          type="text"
          placeholder={data.placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="w-full border-b-2 border-gray-100 focus:border-[#FF6B00] outline-none py-3 transition-colors text-lg bg-transparent"
        />
      )}

      {/* Input dạng Radio/Checkbox */}
      {(data.type === 'radio' || data.type === 'checkbox') && (
        <div className="space-y-3">
          {data.options?.map((opt, index) => (
            <label 
              key={index} 
              className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-orange-100 hover:bg-orange-50/50 cursor-pointer transition-all group"
            >
              <input 
                type={data.type} 
                name={`q-${data.id}`}
                onChange={() => onChange(opt)}
                className="w-5 h-5 accent-[#FF6B00] cursor-pointer"
              />
              <span className="text-gray-700 font-medium group-hover:text-[#FF6B00] transition-colors">
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Input dạng Textarea */}
      {data.type === 'textarea' && (
        <textarea 
          placeholder={data.placeholder}
          rows={4}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
        />
      )}
    </div>
  );
};

export default QuestionCard;