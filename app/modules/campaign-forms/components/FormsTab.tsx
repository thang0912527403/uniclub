import React, { useState } from "react";
import {
  useGetFormsByCampaignQuery,
  useCreateFormMutation,
  useUpdateFormMutation,
  useDeleteFormMutation,
  useGetQuestionsByFormQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} from "~/cores/api";
import type {
  ApplicationFormResponseDto,
  ApplicationQuestionResponseDto,
} from "~/cores/api";
import { FormCard } from "./FormCard";
import { FormModal } from "./FormModal";
import { QuestionRow } from "./QuestionRow";
import { QuestionModal } from "./QuestionModal";

interface FormsTabProps {
  campaignId: number;
  clubId: number;
}

export const FormsTab: React.FC<FormsTabProps> = ({ campaignId, clubId }) => {
  const { data: forms = [], isLoading: formsLoading } =
    useGetFormsByCampaignQuery({ clubId, campaignId });
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingForm, setEditingForm] =
    useState<ApplicationFormResponseDto | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<ApplicationQuestionResponseDto | null>(null);

  const [createForm, { isLoading: formCreating }] = useCreateFormMutation();
  const [updateForm, { isLoading: formUpdating }] = useUpdateFormMutation();
  const [deleteForm] = useDeleteFormMutation();
  const [createQuestion, { isLoading: qCreating }] =
    useCreateQuestionMutation();
  const [updateQuestion, { isLoading: qUpdating }] =
    useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  const selectedForm = forms.find((f) => f.formId === selectedFormId) ?? null;
  const { data: questions = [], isLoading: questionsLoading } =
    useGetQuestionsByFormQuery(
      { formId: selectedFormId! },
      { skip: !selectedFormId },
    );

  const handleCreateForm = async (dto: any) => {
    try {
      await createForm(dto).unwrap();
      setShowFormModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateForm = async (id: number, dto: any) => {
    try {
      await updateForm({ clubId, id, body: dto }).unwrap();
      setShowFormModal(false);
      setEditingForm(null);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleDeleteForm = async (id: number) => {
    if (!confirm("Xóa biểu mẫu này? Toàn bộ câu hỏi sẽ bị xóa.")) return;
    try {
      await deleteForm({ clubId, id }).unwrap();
      if (selectedFormId === id) setSelectedFormId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateQuestion = async (dto: any) => {
    try {
      await createQuestion(dto).unwrap();
      setShowQuestionModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateQuestion = async (
    id: number,
    dto: ApplicationQuestionResponseDto,
  ) => {
    try {
      await updateQuestion({ clubId, id, question: dto }).unwrap();
      setShowQuestionModal(false);
      setEditingQuestion(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("Xóa câu hỏi này?")) return;
    try {
      await deleteQuestion({ clubId, id }).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex gap-6 h-full min-h-[500px]">
      {/* Left: forms list */}
      <div className="w-72 flex-shrink-0 space-y-3">
        <button
          onClick={() => {
            setEditingForm(null);
            setShowFormModal(true);
          }}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-plus" />
          Tạo biểu mẫu mới
        </button>
        {formsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <i className="fa-regular fa-folder-open text-4xl mb-2 block" />
            <p className="text-sm">Chưa có biểu mẫu nào</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {forms.map((form) => (
              <FormCard
                key={form.formId}
                form={form}
                isSelected={selectedFormId === form.formId}
                onSelect={() => setSelectedFormId(form.formId)}
                onDelete={() => handleDeleteForm(form.formId)}
                onEdit={() => {
                  setEditingForm(form);
                  setShowFormModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: questions */}
      <div className="flex-1 min-w-0">
        {!selectedForm ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <i className="fa-regular fa-hand-pointer text-5xl mb-3" />
            <p className="font-medium text-gray-500">
              Chọn một biểu mẫu để quản lý câu hỏi
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Form header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  {selectedForm.formTitle || selectedForm.formName}
                </h3>
                {selectedForm.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedForm.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>
                    <i className="fa-solid fa-list-ol mr-1" />
                    {questions.length} câu hỏi
                  </span>
                  <span>
                    <i className="fa-regular fa-clock mr-1" />
                    {new Date(selectedForm.createdAt).toLocaleDateString(
                      "vi-VN",
                    )}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setShowQuestionModal(true);
                }}
                className="flex-shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all hover:shadow-md flex items-center gap-2"
              >
                <i className="fa-solid fa-plus" />
                Thêm câu hỏi
              </button>
            </div>

            {/* Questions list */}
            {questionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
                  />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <i className="fa-solid fa-circle-question text-4xl mb-2 block" />
                <p className="text-sm">
                  Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên!
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
                {questions.map((q, idx) => (
                  <QuestionRow
                    key={q.questionId}
                    question={q}
                    idx={idx}
                    onEdit={(qItem) => {
                      setEditingQuestion(qItem);
                      setShowQuestionModal(true);
                    }}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <FormModal
          campaignId={campaignId}
          editing={editingForm}
          onClose={() => {
            setShowFormModal(false);
            setEditingForm(null);
          }}
          onCreate={handleCreateForm}
          onUpdate={handleUpdateForm}
          isSaving={formCreating || formUpdating}
        />
      )}
      {showQuestionModal && selectedFormId && (
        <QuestionModal
          formId={selectedFormId}
          editing={editingQuestion}
          onClose={() => {
            setShowQuestionModal(false);
            setEditingQuestion(null);
          }}
          onCreate={handleCreateQuestion}
          onUpdate={handleUpdateQuestion}
          isSaving={qCreating || qUpdating}
        />
      )}
    </div>
  );
};
