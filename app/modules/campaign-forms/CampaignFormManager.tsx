import React, { useState } from 'react';
import { Link } from 'react-router';
import { set } from 'zod';
import {
  useGetFormsByCampaignQuery,
  useCreateFormMutation,
  useUpdateFormMutation,
  useDeleteFormMutation,
  useGetQuestionsByFormQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetApplicationsByCampaignQuery,
  useGetAnswersByApplicationQuery,
  useUpdateApplicationStatusMutation,
} from '~/cores/api';
import type {
  ApplicationFormResponseDto,
  ApplicationQuestionResponseDto,
  ApplicationResponseDto,
} from '~/cores/api';

interface Props {
  campaignId: number;
  campaignName?: string;
}

// ── Status helpers ──────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  REJECTED: { label: 'Từ chối', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  SUCCESS: { label: 'Vào phỏng vấn', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
};

// ── Sub-component: Application Answer Viewer (Tab 3 detail panel) ──────────
const AnswerPanel: React.FC<{ application: ApplicationResponseDto; questions: ApplicationQuestionResponseDto[]; onClose: () => void }> = ({ application, questions, onClose }) => {
  const { data: answers = [], isLoading } = useGetAnswersByApplicationQuery(application.applicationId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-base">Chi tiết phản hồi</h3>
            <p className="text-violet-200 text-xs mt-0.5">Đơn #{application.applicationId} · Nộp: {new Date(application.submissionDate).toLocaleString('vi-VN')}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
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
              const answer = answers.find(a => a.questionId === q.questionId);
              return (
                <div key={q.questionId} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                    {q.questionType || 'Câu hỏi'}{q.isRequired && <span className="text-red-400">*</span>}
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white mb-2">{q.questionText}</p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {answer?.answerText || <span className="text-gray-400 italic">Không có câu trả lời</span>}
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

// ── Sub-component: Question Row ────────────────────────────────────────────
const QuestionRow: React.FC<{
  question: ApplicationQuestionResponseDto;
  idx: number;
  onEdit: (q: ApplicationQuestionResponseDto) => void;
  onDelete: (id: number) => void;
}> = ({ question, idx, onEdit, onDelete }) => (
  <div className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700 transition-all group">
    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">
      {idx + 1}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800 dark:text-white">{question.questionText.split('|')[0]}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 rounded px-1.5 py-0.5">
          <i className="fa-regular fa-keyboard mr-1" />{question.questionType || 'text'}
        </span>
        {question.isRequired && (
          <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded px-1.5 py-0.5">
            <i className="fa-solid fa-asterisk mr-1 text-[9px]" />Bắt buộc
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onEdit(question)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Sửa">
        <i className="fa-solid fa-pen text-sm" />
      </button>
      <button onClick={() => onDelete(question.questionId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Xóa">
        <i className="fa-solid fa-trash text-sm" />
      </button>
    </div>
  </div>
);

// ── Sub-component: Question Modal ──────────────────────────────────────────
const QuestionModal: React.FC<{
  formId: number;
  editing: ApplicationQuestionResponseDto | null;
  onClose: () => void;
  onCreate: (q: { formId: number; questionText: string; questionType: string; isRequired: boolean; questionOptions?: string }) => void;
  onUpdate: (id: number, q: ApplicationQuestionResponseDto) => void;
  isSaving: boolean;
}> = ({ formId, editing, onClose, onCreate, onUpdate, isSaving }) => {
  const [text, setText] = useState(editing?.questionText.split('|')[0] ?? '');
  const [type, setType] = useState(editing?.questionType ?? 'text');
  const [required, setRequired] = useState(editing?.isRequired ?? false);

  const [options, setOptions] = useState<string[]>(() => {
    if (editing?.questionText) {
      return editing.questionText.split('|').slice(1);
    }
    return ['', ''];
  });

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;

    // Tự động thêm ô mới khi điền vào ô cuối cùng
    if (index === newOptions.length - 1 && value.trim() !== '') {
      newOptions.push('');
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

    let optionsString = '';
    if (type === 'radio' || type === 'checkbox') {
      const validOptions = options.map(o => o.trim()).filter(o => o !== '');
      validOptions.unshift(text);

      if (validOptions.length < 2) {
        alert("Vui lòng nhập ít nhất 2 lựa chọn.");
        return;
      }
      optionsString = validOptions.join('|');
    }

    const payload = {
      questionText: optionsString,
      questionType: type,
      isRequired: required,
      questionOptions: (type === 'radio' || type === 'checkbox') ? optionsString : undefined
    };

    if (editing) {
      onUpdate(editing.questionId, { ...editing, ...payload });
    } else {
      onCreate({ formId, ...payload });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-bold text-lg">
            {editing ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
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
              onChange={e => setText(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Bạn biết đến chúng tôi qua đâu?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none text-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Loại câu hỏi</label>
              <select
                value={type}
                onChange={e => {
                  setType(e.target.value);
                  if (e.target.value === 'select' && options.length < 2) {
                    setOptions(['', '']);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:border-orange-500 outline-none text-gray-800 dark:text-white"
              >
                <option value="text">Văn bản</option>
                <option value="textarea">Đoạn văn</option>
                <option value="number">Số</option>
                <option value="date">Ngày</option>
                <option value="radio">Lựa chọn(chỉ chọn 1)</option>
                <option value="checkbox">Lựa chọn(nhiều lựa chọn)</option>
              </select>
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  type="button"
                  onClick={() => setRequired(r => !r)}
                  className={`relative w-11 h-6 rounded-full transition-all ${required ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${required ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-orange-500 transition-colors">Bắt buộc</span>
              </label>
            </div>
          </div>

          {/* Hiển thị danh sách lựa chọn nếu là loại 'select' */}
          {(type === 'radio' || type === 'checkbox') && (
            <div className="space-y-3 animate-fadeIn">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Các lựa chọn <span className="text-xs font-normal text-gray-400 ml-1">(Ít nhất 2)</span>
              </label>
              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex gap-2 items-center group">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(index, e.target.value)}
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
              {isSaving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
              {editing ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-component: Form Card ─────────────────────────────────────────────
const FormCard: React.FC<{
  form: ApplicationFormResponseDto;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ form, isSelected, onSelect, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const applyUrl = `${window.location.origin}/question/${form.formId}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(applyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all group ${isSelected
        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-md'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-700'
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{form.formTitle || form.formName}</p>
          {form.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{form.description}</p>}
          <p className="text-[10px] text-gray-400 mt-2">
            <i className="fa-regular fa-clock mr-1" />
            {new Date(form.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Sửa">
            <i className="fa-solid fa-pen text-xs" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Xóa">
            <i className="fa-solid fa-trash text-xs" />
          </button>
        </div>
      </div>

      {/* Apply / Share row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <Link
          to={`/question/${form.formId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-all"
        >
          <i className="fa-solid fa-pen-to-square text-[10px]" />
          Ứng tuyển
        </Link>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          title="Sao chép link ứng tuyển"
        >
          <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'} text-[10px]`} />
          {copied ? 'Đã chép!' : 'Sao chép link'}
        </button>
      </div>

      {isSelected && <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-orange-500" />}
    </div>
  );
};

// ── Form Creation/Edit Modal ───────────────────────────────────────────────
const FormModal: React.FC<{
  campaignId: number;
  editing: ApplicationFormResponseDto | null;
  onClose: () => void;
  onCreate: (f: { campaignId: number; formName: string; formTitle: string; description: string }) => void;
  onUpdate: (id: number, f: { formName: string; formTitle: string; description: string }) => void;
  isSaving: boolean;
}> = ({ campaignId, editing, onClose, onCreate, onUpdate, isSaving }) => {
  const [name, setName] = useState(editing?.formName ?? '');
  const [title, setTitle] = useState(editing?.formTitle ?? '');
  const [desc, setDesc] = useState(editing?.description ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      onUpdate(editing.formId, { formName: name, formTitle: title, description: desc });
    } else {
      onCreate({ campaignId, formName: name, formTitle: title, description: desc });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold">{editing ? 'Chỉnh sửa biểu mẫu' : 'Tạo biểu mẫu mới'}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tên biểu mẫu <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên định danh của form..." className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tiêu đề hiển thị</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề người dùng thấy..." className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mô tả</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Mô tả biểu mẫu..." className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-gray-800 dark:text-white" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Huỷ</button>
            <button onClick={handleSave} disabled={isSaving || !name.trim()} className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
              {editing ? 'Lưu thay đổi' : 'Tạo biểu mẫu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Tab 1: Forms & Questions ─────────────────────────────────────────────
const FormsTab: React.FC<{ campaignId: number }> = ({ campaignId }) => {
  const { data: forms = [], isLoading: formsLoading } = useGetFormsByCampaignQuery(campaignId);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingForm, setEditingForm] = useState<ApplicationFormResponseDto | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestionResponseDto | null>(null);

  const [createForm, { isLoading: formCreating }] = useCreateFormMutation();
  const [updateForm, { isLoading: formUpdating }] = useUpdateFormMutation();
  const [deleteForm] = useDeleteFormMutation();
  const [createQuestion, { isLoading: qCreating }] = useCreateQuestionMutation();
  const [updateQuestion, { isLoading: qUpdating }] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  const selectedForm = forms.find(f => f.formId === selectedFormId) ?? null;
  const { data: questions = [], isLoading: questionsLoading } = useGetQuestionsByFormQuery(selectedFormId!, { skip: !selectedFormId });

  const handleCreateForm = async (dto: any) => {
    try { await createForm(dto).unwrap(); setShowFormModal(false); } catch (e) { console.error(e); }
  };
  const handleUpdateForm = async (id: number, dto: any) => {
    try { await updateForm({ id, body: dto }).unwrap(); setShowFormModal(false); setEditingForm(null); } catch (e) { console.error(e); }
  };
  const handleDeleteForm = async (id: number) => {
    if (!confirm('Xóa biểu mẫu này? Toàn bộ câu hỏi sẽ bị xóa.')) return;
    try { await deleteForm(id).unwrap(); if (selectedFormId === id) setSelectedFormId(null); } catch (e) { console.error(e); }
  };
  const handleCreateQuestion = async (dto: any) => {
    try { await createQuestion(dto).unwrap(); setShowQuestionModal(false); } catch (e) { console.error(e); }
  };
  const handleUpdateQuestion = async (id: number, dto: ApplicationQuestionResponseDto) => {
    try { await updateQuestion({ id, question: dto }).unwrap(); setShowQuestionModal(false); setEditingQuestion(null); } catch (e) { console.error(e); }
  };
  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try { await deleteQuestion(id).unwrap(); } catch (e) { console.error(e); }
  };

  return (
    <div className="flex gap-6 h-full min-h-[500px]">
      {/* Left: forms list */}
      <div className="w-72 flex-shrink-0 space-y-3">
        <button
          onClick={() => { setEditingForm(null); setShowFormModal(true); }}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-plus" />
          Tạo biểu mẫu mới
        </button>

        {formsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />)}
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <i className="fa-regular fa-folder-open text-4xl mb-2 block" />
            <p className="text-sm">Chưa có biểu mẫu nào</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {forms.map(form => (
              <FormCard
                key={form.formId}
                form={form}
                isSelected={selectedFormId === form.formId}
                onSelect={() => setSelectedFormId(form.formId)}
                onEdit={() => { setEditingForm(form); setShowFormModal(true); }}
                onDelete={() => handleDeleteForm(form.formId)}
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
            <p className="font-medium text-gray-500">Chọn một biểu mẫu để quản lý câu hỏi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Form header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{selectedForm.formTitle || selectedForm.formName}</h3>
                {selectedForm.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedForm.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span><i className="fa-solid fa-list-ol mr-1" />{questions.length} câu hỏi</span>
                  <span><i className="fa-regular fa-clock mr-1" />{new Date(selectedForm.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <button
                onClick={() => { setEditingQuestion(null); setShowQuestionModal(true); }}
                className="flex-shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all hover:shadow-md flex items-center gap-2"
              >
                <i className="fa-solid fa-plus" />
                Thêm câu hỏi
              </button>
            </div>

            {/* Questions list */}
            {questionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />)}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <i className="fa-solid fa-circle-question text-4xl mb-2 block" />
                <p className="text-sm">Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên!</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
                {questions.map((q, idx) => (
                  <QuestionRow
                    key={q.questionId}
                    question={q}
                    idx={idx}
                    onEdit={qItem => { setEditingQuestion(qItem); setShowQuestionModal(true); }}
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
          onClose={() => { setShowFormModal(false); setEditingForm(null); }}
          onCreate={handleCreateForm}
          onUpdate={handleUpdateForm}
          isSaving={formCreating || formUpdating}
        />
      )}
      {showQuestionModal && selectedFormId && (
        <QuestionModal
          formId={selectedFormId}
          editing={editingQuestion}
          onClose={() => { setShowQuestionModal(false); setEditingQuestion(null); }}
          onCreate={handleCreateQuestion}
          onUpdate={handleUpdateQuestion}
          isSaving={qCreating || qUpdating}
        />
      )}
    </div>
  );
};

// ── Inline Answer Row (expands under a table row) ──────────────────────────
const InlineAnswerRow: React.FC<{ application: ApplicationResponseDto; colSpan: number }> = ({ application, colSpan }) => {
  const { data: answers = [], isLoading } = useGetAnswersByApplicationQuery(application.applicationId);
  const { data: questions = [] } = useGetQuestionsByFormQuery(application.formId);

  return (
    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-900/10 dark:to-purple-900/10 border-t border-b border-violet-100 dark:border-violet-800/30 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
              <i className="fa-solid fa-message text-white text-[10px]" />
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-white">Câu trả lời</span>
            <span className="text-xs text-gray-400">· Đơn #{application.applicationId}</span>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <i className="fa-solid fa-spinner fa-spin" /> Đang tải...
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-2">Không có câu hỏi.</p>
          ) : (
            <div className="grid gap-2">
              {questions.map((q, idx) => {
                const answer = answers.find(a => a.questionId === q.questionId);
                return (
                  <div key={q.questionId} className="flex gap-3 bg-white/80 dark:bg-gray-800/60 rounded-lg p-3 border border-white dark:border-gray-700/50">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/15 text-violet-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                        {q.questionText}
                        {q.isRequired && <span className="text-red-400 ml-1">*</span>}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {answer?.answerText || <span className="text-gray-400 italic text-xs">Không trả lời</span>}
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

// ── Status Badge & Contextual Actions ────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const sConf = statusConfig[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  const dotColor = sConf.cls.includes('amber') ? 'bg-amber-500' :
                   sConf.cls.includes('blue') ? 'bg-blue-500' :
                   sConf.cls.includes('red') ? 'bg-red-500' :
                   sConf.cls.includes('green') ? 'bg-green-500' : 'bg-gray-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${sConf.cls}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {sConf.label}
    </span>
  );
};

const ApplicationStatusActions: React.FC<{
  currentStatus: string;
  onChangeStatus: (newStatus: string) => void;
}> = ({ currentStatus, onChangeStatus }) => {
  // --- Flow: PENDING -> SUCCESS (Vào phỏng vấn) -> APPROVED (Đã duyệt) ---
  
  if (currentStatus === 'PENDING') {
    return (
      <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-gray-700 pr-3 mr-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); onChangeStatus('SUCCESS'); }}
          className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 text-xs font-semibold rounded-lg transition-colors border border-green-200 dark:border-green-800"
          title="Chuyển sang Vào phỏng vấn"
        >
          <i className="fa-solid fa-check mr-1.5" />Vào phỏng vấn
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onChangeStatus('REJECTED'); }}
          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 text-xs font-semibold rounded-lg transition-colors border border-red-200 dark:border-red-800"
          title="Từ chối"
        >
          <i className="fa-solid fa-xmark mr-1.5" />Từ chối
        </button>
      </div>
    );
  }

  if (currentStatus === 'SUCCESS') {
    return (
      <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-gray-700 pr-3 mr-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); onChangeStatus('APPROVED'); }}
          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 text-xs font-semibold rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
          title="Đánh giá là Đã duyệt"
        >
          <i className="fa-solid fa-medal mr-1.5" />Duyệt qua
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onChangeStatus('REJECTED'); }}
          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 text-xs font-semibold rounded-lg transition-colors border border-red-200 dark:border-red-800"
          title="Từ chối"
        >
          <i className="fa-solid fa-xmark mr-1.5" />Từ chối
        </button>
      </div>
    );
  }

  // If APPROVED or REJECTED
  return (
    <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-gray-700 pr-3 mr-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); onChangeStatus('PENDING'); }}
        className="px-2 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium flex items-center gap-1"
        title="Hoàn tác về Chờ duyệt"
      >
        <i className="fa-solid fa-rotate-left mr-1" />Hoàn tác
      </button>
    </div>
  );
};

// ── Bulk Action Bar ────────────────────────────────────────────────────────
const BulkActionBar: React.FC<{
  count: number;
  onClear: () => void;
  onBulkStatus: (status: string) => void;
}> = ({ count, onClear, onBulkStatus }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-indigo-600 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">{count}</span>
        <span className="text-sm font-medium">đơn đã chọn</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <i className="fa-solid fa-pen text-[10px]" />
            Đổi trạng thái
            <i className={`fa-solid fa-chevron-down text-[8px] transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute z-50 bottom-full right-0 mb-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 min-w-[150px] overflow-hidden">
                {Object.entries(statusConfig).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { onBulkStatus(k); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button onClick={onClear} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
          Bỏ chọn
        </button>
      </div>
    </div>
  );
};

// ── Tab 2 & 3: Applications table + Response viewer ───────────────────────
const APPS_PER_PAGE = 10;

const ApplicationsTab: React.FC<{ campaignId: number }> = ({ campaignId }) => {
  const { data: forms = [] } = useGetFormsByCampaignQuery(campaignId);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<ApplicationResponseDto | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { data: applications = [], isLoading } = useGetApplicationsByCampaignQuery({ campaignId, status: statusFilter || undefined });
  const [updateStatus] = useUpdateApplicationStatusMutation();

  // ── Derived data ──
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    Object.keys(statusConfig).forEach(k => { counts[k] = 0; });
    applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  }, [applications]);

  const filteredApps = React.useMemo(() => {
    let result = [...applications];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.applicationId.toString().includes(q) ||
        a.userId.toLowerCase().includes(q) ||
        forms.find(f => f.formId === a.formId)?.formTitle?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [applications, searchQuery, forms]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / APPS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedApps = filteredApps.slice((safePage - 1) * APPS_PER_PAGE, safePage * APPS_PER_PAGE);

  // ── Handlers ──
  const handleStatusChange = async (app: ApplicationResponseDto, newStatus: string) => {
    try { await updateStatus({ id: app.applicationId, body: { status: newStatus } }).unwrap(); } catch (e) { console.error(e); }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedApps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedApps.map(a => a.applicationId)));
    }
  };

  const handleBulkStatus = async (newStatus: string) => {
    const promises = Array.from(selectedIds).map(id =>
      updateStatus({ id, body: { status: newStatus } }).unwrap().catch(console.error)
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const statuses = ['', 'PENDING', 'APPROVED', 'REJECTED', 'SUCCESS'];
  const allSelected = pagedApps.length > 0 && selectedIds.size === pagedApps.length;
  const TABLE_COL_COUNT = 6;

  return (
    <div className="space-y-4">
      {/* ── Stats Summary ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(statusConfig).map(([k, v]) => (
          <div key={k} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${v.cls}`}>
            {v.label}: <span className="font-bold">{statusCounts[k] ?? 0}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-500 font-medium">
          <i className="fa-solid fa-users mr-1" />Tổng: {applications.length} đơn
        </span>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1 overflow-x-auto">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {s ? (statusConfig[s]?.label ?? s) : 'Tất cả'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Tìm theo ID, userId..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <i className="fas fa-times text-[10px]" />
            </button>
          )}
        </div>

        <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
          {filteredApps.length} kết quả
        </span>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onBulkStatus={handleBulkStatus}
        />
      )}

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />)}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <i className="fa-regular fa-folder-open text-5xl mb-3 block" />
          <p className="font-medium">{searchQuery ? 'Không tìm thấy đơn phù hợp' : 'Không có đơn ứng tuyển nào'}</p>
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="mt-2 text-xs text-orange-500 hover:text-orange-600 font-semibold">
              <i className="fas fa-arrow-rotate-left mr-1" />Xóa tìm kiếm
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Form</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nộp lúc</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {pagedApps.map(app => {
                  const isExpanded = expandedIds.has(app.applicationId);
                  return (
                    <React.Fragment key={app.applicationId}>
                      <tr className={`hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors ${isExpanded ? 'bg-violet-50/30 dark:bg-violet-900/10' : ''}`}>
                        <td className="px-3 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.applicationId)}
                            onChange={() => toggleSelect(app.applicationId)}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500">#{app.applicationId}</td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 text-xs">
                          {forms.find(f => f.formId === app.formId)?.formTitle ?? `Form #${app.formId}`}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{new Date(app.submissionDate).toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <ApplicationStatusActions
                              currentStatus={app.status}
                              onChangeStatus={(newStatus) => handleStatusChange(app, newStatus)}
                            />
                            
                            <button
                              onClick={() => toggleExpand(app.applicationId)}
                              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                isExpanded
                                  ? 'bg-violet-500 text-white shadow-sm'
                                  : 'text-violet-600 hover:text-violet-700 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                              }`}
                              title={isExpanded ? 'Thu gọn' : 'Mở rộng xem câu trả lời'}
                            >
                              <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`} />
                              {isExpanded ? 'Thu gọn' : 'Xem'}
                            </button>
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all flex items-center gap-1.5"
                              title="Xem chi tiết trong modal"
                            >
                              <i className="fa-solid fa-expand text-[10px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Inline expanded answers */}
                      {isExpanded && <InlineAnswerRow application={app} colSpan={TABLE_COL_COUNT} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
              <span className="text-xs text-gray-500">
                Trang {safePage}/{totalPages} · {filteredApps.length} đơn
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  <i className="fas fa-chevron-left" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) { page = i + 1; }
                  else if (safePage <= 3) { page = i + 1; }
                  else if (safePage >= totalPages - 2) { page = totalPages - 4 + i; }
                  else { page = safePage - 2 + i; }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                        safePage === page
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Answer modal (secondary option) */}
      {selectedApp && (
        <AnswerViewerForApp
          app={selectedApp}
          forms={forms}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
};

// Wrapper so we can fetch questions per form lazily
const AnswerViewerForApp: React.FC<{
  app: ApplicationResponseDto;
  forms: ApplicationFormResponseDto[];
  onClose: () => void;
}> = ({ app, forms, onClose }) => {
  const { data: questions = [] } = useGetQuestionsByFormQuery(app.formId);
  return <AnswerPanel application={app} questions={questions} onClose={onClose} />;
};

// ── Main Export ─────────────────────────────────────────────────────────────
const CampaignFormManager: React.FC<Props> = ({ campaignId, campaignName }) => {
  const [tab, setTab] = useState<'forms' | 'applications'>('forms');

  const tabs = [
    { key: 'forms' as const, label: 'Biểu mẫu & Câu hỏi', icon: 'fa-solid fa-clipboard-list' },
    { key: 'applications' as const, label: 'Đơn ứng tuyển & Phản hồi', icon: 'fa-solid fa-inbox' },
  ];

  return (
    <div className="space-y-6">
      {/* Page title strip */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-file-lines text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Quản lý biểu mẫu ứng tuyển
          </h2>
          {campaignName && <p className="text-sm text-gray-500 dark:text-gray-400">{campaignName}</p>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${tab === t.key
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <i className={`${t.icon} text-xs ${tab === t.key ? 'text-orange-500' : ''}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'forms' && <FormsTab campaignId={campaignId} />}
        {tab === 'applications' && <ApplicationsTab campaignId={campaignId} />}
      </div>
    </div>
  );
};

export default CampaignFormManager;
