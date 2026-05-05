import React, { useState } from "react";
import type { ApplicationQuestionResponseDto } from "~/cores/api";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface QuestionRowProps {
  question: ApplicationQuestionResponseDto;
  idx: number;
  onEdit: (q: ApplicationQuestionResponseDto) => void;
  onDelete: (id: number) => void;
}

export const QuestionRow: React.FC<QuestionRowProps> = ({
  question,
  idx,
  onEdit,
  onDelete,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700 transition-all group">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {question.questionText.split("|")[0]}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 rounded px-1.5 py-0.5">
              <i className="fa-regular fa-keyboard mr-1" />
              {question.questionType || "text"}
            </span>
            {question.isRequired && (
              <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded px-1.5 py-0.5">
                <i className="fa-solid fa-asterisk mr-1 text-[9px]" />
                Bắt buộc
              </span>
            )}
          </div>
          {(question.questionType === "radio" ||
            question.questionType === "checkbox") && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {question.questionText
                .split("|")
                .slice(1)
                .map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 rounded-full px-2.5 py-0.5"
                  >
                    <i
                      className={`fa-regular ${question.questionType === "radio" ? "fa-circle" : "fa-square"} text-[9px]`}
                    />
                    {opt}
                  </span>
                ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(question)}
            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
            title="Sửa"
          >
            <i className="fa-solid fa-pen text-sm" />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            title="Xóa"
          >
            <i className="fa-solid fa-trash text-sm" />
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDeleteModal
          message="Câu hỏi này sẽ bị xóa vĩnh viễn và không thể khôi phục."
          onConfirm={() => {
            onDelete(question.questionId);
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};
