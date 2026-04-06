import React from "react";
import {
  useGetAnswersByApplicationQuery,
  useGetQuestionsByFormQuery,
} from "~/cores/api";
import type { ApplicationResponseDto } from "~/cores/api";

interface InlineAnswerRowProps {
  clubId: number;
  application: ApplicationResponseDto;
  colSpan: number;
}

export const InlineAnswerRow: React.FC<InlineAnswerRowProps> = ({
  clubId,
  application,
  colSpan,
}) => {
  const { data: answers = [], isLoading } = useGetAnswersByApplicationQuery({
    clubId,
    applicationId: application.applicationId,
  });
  const { data: questions = [] } = useGetQuestionsByFormQuery({
    clubId,
    formId: application.formId,
  });

  return (
    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-900/10 dark:to-purple-900/10 border-t border-b border-violet-100 dark:border-violet-800/30 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
              <i className="fa-solid fa-message text-white text-[10px]" />
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-white">
              Câu trả lời
            </span>
            <span className="text-xs text-gray-400">
              · Đơn #{application.applicationId}
            </span>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <i className="fa-solid fa-spinner fa-spin" /> Đang tải...
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-2">
              Không có câu hỏi.
            </p>
          ) : (
            <div className="grid gap-2">
              {questions.map((q, idx) => {
                const answer = answers.find(
                  (a) => a.questionId === q.questionId,
                );
                return (
                  <div
                    key={q.questionId}
                    className="flex gap-3 bg-white/80 dark:bg-gray-800/60 rounded-lg p-3 border border-white dark:border-gray-700/50"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/15 text-violet-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                        {q.questionText}
                        {q.isRequired && (
                          <span className="text-red-400 ml-1">*</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {answer?.answerText || (
                          <span className="text-gray-400 italic text-xs">
                            Không trả lời
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};
