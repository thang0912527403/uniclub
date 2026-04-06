import React from "react";
import { useGetAnswersByApplicationQuery } from "~/cores/api";
import type {
  ApplicationResponseDto,
  ApplicationQuestionResponseDto,
} from "~/cores/api";

interface AnswerPanelProps {
  clubId: number;
  application: ApplicationResponseDto;
  questions: ApplicationQuestionResponseDto[];
  onClose: () => void;
}

export const AnswerPanel: React.FC<AnswerPanelProps> = ({
  clubId,
  application,
  questions,
  onClose,
}) => {
  const { data: answers = [], isLoading } = useGetAnswersByApplicationQuery({
    clubId,
    applicationId: application.applicationId,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-base">
              Chi tiết phản hồi
            </h3>
            <p className="text-violet-200 text-xs mt-0.5">
              Đơn #{application.applicationId} · Nộp:{" "}
              {new Date(application.submissionDate).toLocaleString("vi-VN")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <i className="fa-solid fa-spinner fa-spin text-2xl mr-3" />
              <span>Đang tải phản hồi...</span>
            </div>
          ) : answers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <i className="fa-solid fa-envelope-open-text text-4xl mb-3 block" />
              <p className="text-sm">Không có câu trả lời nào.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const answer = answers.find((a) => a.questionId === q.questionId);
              return (
                <div
                  key={q.questionId}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {q.questionType || "Câu hỏi"}
                    {q.isRequired && (
                      <span className="text-red-400">*</span>
                    )}
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                    {q.questionText}
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {answer?.answerText || (
                        <span className="text-gray-400 italic">
                          Không có câu trả lời
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
