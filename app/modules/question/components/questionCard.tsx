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

  const textValue = typeof value === 'string' ? value : value != null ? String(value) : '';
  const options = data.questionText.split('|');
  const hasOptions = options.length > 1;
  const isRadio = data.questionType === 'radio';
  const isCheckbox = data.questionType === 'checkbox';
  const isTextarea = data.questionType === 'textarea';
  const isText =
    data.questionType === 'text' ||
    !data.questionType ||
    (isRadio && !hasOptions) ||
    (isCheckbox && !hasOptions) ||
    (isRadio === false && isCheckbox === false && isTextarea === false);

  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <label className="block text-xl font-bold mb-6 text-gray-800 leading-tight">
        {options[0]}
        {data.isRequired && <span className="text-red-500 ml-1.5">*</span>}
      </label>

      {isText && (
        <input
          type="text"
          value={textValue}
          placeholder="Nhập câu trả lời của bạn..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="w-full border-b-2 border-gray-100 focus:border-[#FF6B00] outline-none py-3 transition-colors text-lg bg-transparent"
          autoComplete="off"
        />
      )}

      {(isRadio || isCheckbox) && hasOptions && (
        <div className="space-y-3">
          {options.slice(1).map((opt, index) => (
            <label
              key={index}
              className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-orange-100 hover:bg-orange-50/50 cursor-pointer transition-all group"
            >
              <input
                type={isRadio ? 'radio' : 'checkbox'}
                name={`q-${data.questionId}`}
                value={opt}
                checked={isRadio ? textValue === opt : (Array.isArray(value) ? value : []).includes(opt)}
                onChange={() => (isRadio ? onChange(opt) : handleCheckboxChange(opt))}
                className="w-5 h-5 accent-[#FF6B00] cursor-pointer"
              />
              <span className="text-gray-700 font-medium group-hover:text-[#FF6B00] transition-colors">
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}

      {isTextarea && (
        <textarea
          value={textValue}
          placeholder="Nhập câu trả lời của bạn..."
          rows={4}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
          autoComplete="off"
        />
      )}
    </div>
  );
};

export default QuestionCard;