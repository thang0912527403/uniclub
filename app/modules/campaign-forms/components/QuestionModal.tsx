import React, { useState } from "react";
import type { ApplicationQuestionResponseDto } from "~/cores/api";

interface QuestionModalProps {
  formId: number;
  editing: ApplicationQuestionResponseDto | null;
  onClose: () => void;
  onCreate: (q: {
    formId: number;
    questionText: string;
    questionType: string;
    isRequired: boolean;
    questionOptions?: string;
  }) => void;
  onUpdate: (id: number, q: ApplicationQuestionResponseDto) => void;
  isSaving: boolean;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  formId,
  editing,
  onClose,
  onCreate,
  onUpdate,
  isSaving,
}) => {
  const [text, setText] = useState(editing?.questionText.split("|")[0] ?? "");
  const [type, setType] = useState(editing?.questionType ?? "text");
  const [required, setRequired] = useState(editing?.isRequired ?? false);

  const [options, setOptions] = useState<string[]>(() => {
    if (editing?.questionText) {
      return editing.questionText.split("|").slice(1);
    }
    return ["", ""];
  });

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    if (index === newOptions.length - 1 && value.trim() !== "") {
      newOptions.push("");
    }
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    if (!text.trim()) return;

    let optionsString = "";
    if (type === "radio" || type === "checkbox") {
      const validOptions = options
        .map((o) => o.trim())
        .filter((o) => o !== "");
      validOptions.unshift(text);

      if (validOptions.length < 2) {
        alert("Vui lòng nhập ít nhất 2 lựa chọn.");
        return;
      }
      optionsString = validOptions.join("|");
    }

    const payload = {
      questionText: text,
      questionType: type,
      isRequired: required,
      questionOptions:
        type === "radio" || type === "checkbox" ? optionsString : undefined,
    };

    if (editing) {
      onUpdate(editing.questionId, { ...editing, ...payload });
    } else {
      onCreate({ formId, ...payload });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-bold text-lg">
            {editing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Nội dung câu hỏi */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nội dung câu hỏi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Bạn biết đến chúng tôi qua đâu?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none text-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Loại câu hỏi
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (e.target.value === "select" && options.length < 2) {
                    setOptions(["", ""]);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:border-orange-500 outline-none text-gray-800 dark:text-white"
              >
                <option value="text">Văn bản</option>
                <option value="textarea">Đoạn văn</option>
                {/* <option value="number">Số</option> */}
                <option value="date">Ngày</option>
                <option value="radio">Lựa chọn(chỉ chọn 1)</option>
                <option value="checkbox">Lựa chọn(nhiều lựa chọn)</option>
              </select>
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  type="button"
                  onClick={() => setRequired((r) => !r)}
                  className={`relative w-11 h-6 rounded-full transition-all ${required ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${required ? "left-6" : "left-1"}`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-orange-500 transition-colors">
                  Bắt buộc
                </span>
              </label>
            </div>
          </div>

          {/* Options list for radio/checkbox */}
          {(type === "radio" || type === "checkbox") && (
            <div className="space-y-3 animate-fadeIn">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Các lựa chọn{" "}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  (Ít nhất 2)
                </span>
              </label>
              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex gap-2 items-center group">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        placeholder={`Lựa chọn ${index + 1}...`}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:border-orange-500 outline-none text-gray-800 dark:text-white transition-all"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        {index + 1}
                      </span>
                    </div>
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        title="Xóa"
                      >
                        <i className="fa-solid fa-trash-can text-sm" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !text.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <i className="fa-solid fa-spinner fa-spin" />
              ) : (
                <i className="fa-solid fa-check" />
              )}
              {editing ? "Lưu thay đổi" : "Tạo câu hỏi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
