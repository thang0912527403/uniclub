import React, { useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import {
  useGetCampaignCriteriaQuery,
  useAssignCriteriaMutation,
  useGetCriteriaScoresQuery,
  useGetCriteriaForAssignmentQuery,
  useCreateCriterionMutation,
  useUpdateCriterionMutation,
  useDeleteCriterionMutation,
} from '~/cores/api/interviewApi';

interface CriteriaAssignmentProps {
  scheduleId: number;
  assignmentId: number;
  campaignId: number;
  interviewerName?: string;
  readOnly?: boolean;
  onSuccess?: () => void;
}

const CriteriaAssignment: React.FC<CriteriaAssignmentProps> = ({
  scheduleId, assignmentId, campaignId, interviewerName, readOnly, onSuccess,
}) => {
  const { data: criteria, isLoading: isLoadingCriteria } = useGetCampaignCriteriaQuery(campaignId);
  const { data: criteriaScores, isLoading: isLoadingScores, isFetching } = useGetCriteriaScoresQuery({ scheduleId, assignmentId });
  const { data: draftCriteria, isLoading: isLoadingDrafts } = useGetCriteriaForAssignmentQuery({ scheduleId, assignmentId });
  const [assignCriteria] = useAssignCriteriaMutation();
  const [createCriterion] = useCreateCriterionMutation();
  const [updateCriterion, { isLoading: isUpdating }] = useUpdateCriterionMutation();
  const [deleteCriterion] = useDeleteCriterionMutation();

  // Derive assigned IDs from CriteriaScore API response
  const assignedIds = useMemo(
    () => (criteriaScores || []).map(s => s.evaluationCriterionId),
    [criteriaScores],
  );

  const drafts = useMemo(
    () => (draftCriteria || []).filter(c => c.isDraft),
    [draftCriteria],
  );

  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  // Draft criteria state
  const [isAddingDraft, setIsAddingDraft] = useState(false);
  const [newDraftName, setNewDraftName] = useState('');
  const [newDraftDesc, setNewDraftDesc] = useState('');
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [addDraftError, setAddDraftError] = useState<string | null>(null);

  // Inline edit state: criterionId → { name, desc }
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isDisabled = readOnly || savedSuccessfully;
  const isLoading = isLoadingCriteria || isLoadingScores;

  // ── Sync selected state when API data arrives or changes ──
  useEffect(() => {
    if (!isLoadingScores && !isFetching && criteriaScores) {
      setSelected(assignedIds);
    }
  }, [criteriaScores, isLoadingScores, isFetching]);

  const hasChanges = useMemo(() => {
    if (selected.length !== assignedIds.length) return true;
    const sorted1 = [...selected].sort();
    const sorted2 = [...assignedIds].sort();
    return sorted1.some((v, i) => v !== sorted2[i]);
  }, [selected, assignedIds]);

  const toggle = (criterionId: number) => {
    if (isDisabled) return;
    setSelected((prev) =>
      prev.includes(criterionId) ? prev.filter((id) => id !== criterionId) : [...prev, criterionId]
    );
  };

  const selectAll = () => {
    if (isDisabled || !criteria) return;
    setSelected(criteria.map(c => c.id));
  };

  const deselectAll = () => {
    if (isDisabled) return;
    setSelected([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await assignCriteria({ scheduleId, assignmentId, dto: { criteriaIds: selected } }).unwrap();
      message.success(`Đã cập nhật ${selected.length} tiêu chí`);
      setSavedSuccessfully(true);
      onSuccess?.();
    } catch (err: unknown) {
      setError('Phân tiêu chí thất bại');
      console.error('Failed to assign criteria:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDraft = async () => {
    if (!newDraftName.trim()) return;
    setAddDraftError(null);
    setIsCreatingDraft(true);
    try {
      await createCriterion({
        campaignId,
        dto: { name: newDraftName.trim(), description: newDraftDesc.trim() || null, isDraft: true, assignmentId },
      }).unwrap();
      setNewDraftName('');
      setNewDraftDesc('');
      setIsAddingDraft(false);
    } catch (err) {
      setAddDraftError('Thêm tiêu chí thất bại');
      console.error('Failed to create draft criterion:', err);
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const startEdit = (id: number, name: string, desc: string | null) => {
    setEditingId(id);
    setEditName(name);
    setEditDesc(desc || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  };

  const handleUpdate = async (criterionId: number) => {
    if (!editName.trim()) return;
    try {
      await updateCriterion({
        campaignId,
        criterionId,
        assignmentId,
        dto: { name: editName.trim(), description: editDesc.trim() || null },
      }).unwrap();
      cancelEdit();
    } catch (err) {
      console.error('Failed to update criterion:', err);
      message.error('Cập nhật thất bại');
    }
  };

  const handleDelete = async (criterionId: number) => {
    setDeletingId(criterionId);
    try {
      await deleteCriterion({ campaignId, criterionId, assignmentId }).unwrap();
    } catch (err) {
      console.error('Failed to delete criterion:', err);
      message.error('Xóa thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!criteria || criteria.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        <i className="fa-solid fa-list-check text-xl mb-2 block" />
        <p className="text-sm">Chưa có tiêu chí nào trong campaign.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`fa-solid fa-list-check ${savedSuccessfully ? 'text-green-500' : 'text-blue-500'}`} />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {readOnly ? 'Tiêu chí được phân' : savedSuccessfully ? 'Đã lưu tiêu chí' : `Phân tiêu chí cho ${interviewerName || 'PV viên'}`}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {!isDisabled && (
            <button
              type="button"
              onClick={selected.length === criteria.length ? deselectAll : selectAll}
              className="text-[11px] text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {selected.length === criteria.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          )}
          {!readOnly && !isAddingDraft && (
            <button
              type="button"
              onClick={() => setIsAddingDraft(true)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-all"
              title="Thêm tiêu chí riêng"
            >
              <i className="fa-solid fa-plus text-[9px]" />
              Thêm tiêu chí riêng
            </button>
          )}
        </div>
      </div>

      {!isDisabled && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Chọn tiêu chí mà PV viên này chịu trách nhiệm đánh giá. Không chọn = đánh giá tất cả.
        </p>
      )}

      {/* Success banner with re-edit */}
      {savedSuccessfully && !readOnly && (
        <div className="px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-xs" />
            Đã lưu {selected.length} tiêu chí thành công
          </span>
          <button
            type="button"
            onClick={() => setSavedSuccessfully(false)}
            className="text-xs font-medium text-blue-500 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Chỉnh sửa lại
          </button>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <i className="fa-solid fa-circle-exclamation text-xs" />
          {error}
        </div>
      )}

      {/* Default criteria list */}
      <div className="space-y-1.5">
        {criteria.map((c) => {
          const isSelected = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              disabled={isDisabled}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? savedSuccessfully
                    ? 'border-green-300 bg-green-50/50 dark:bg-green-900/20'
                    : 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : isDisabled
                    ? 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isDisabled ? 'cursor-default opacity-75' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2.5">
                <i className={`fa-${isSelected ? `solid fa-square-check ${savedSuccessfully ? 'text-green-500' : 'text-blue-500'}` : 'regular fa-square text-gray-400'} text-base`} />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-500 dark:text-gray-400">{c.description}</p>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Save button — only when not read-only and not saved */}
      {!readOnly && !savedSuccessfully && (
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`w-full px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            hasChanges
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:scale-[1.01]'
              : 'bg-gray-400'
          }`}
        >
          {saving
            ? 'Đang lưu...'
            : hasChanges
              ? `Lưu thay đổi (${selected.length} tiêu chí)`
              : `Đã lưu (${selected.length} tiêu chí)`}
        </button>
      )}

      {/* Draft criteria section */}
      <div className="pt-1 border-t border-dashed border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1.5 mb-2">
          <i className="fa-solid fa-pen-to-square text-orange-400 text-xs" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Tiêu chí riêng ({drafts.length})
          </span>
        </div>

        {/* Add draft form */}
        {isAddingDraft && (
          <div className="mb-2 p-3 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-900/10 space-y-2">
            <input
              type="text"
              value={newDraftName}
              onChange={(e) => setNewDraftName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddDraft(); if (e.key === 'Escape') { setIsAddingDraft(false); setNewDraftName(''); setNewDraftDesc(''); } }}
              placeholder="Tên tiêu chí mới..."
              className="w-full px-3 py-1.5 rounded-lg border border-orange-200 bg-white dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              autoFocus
            />
            <input
              type="text"
              value={newDraftDesc}
              onChange={(e) => setNewDraftDesc(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddDraft(); if (e.key === 'Escape') { setIsAddingDraft(false); setNewDraftName(''); setNewDraftDesc(''); } }}
              placeholder="Mô tả (tùy chọn)..."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
            {addDraftError && <p className="text-xs text-red-500">{addDraftError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setIsAddingDraft(false); setNewDraftName(''); setNewDraftDesc(''); setAddDraftError(null); }}
                className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddDraft}
                disabled={!newDraftName.trim() || isCreatingDraft}
                className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isCreatingDraft
                  ? <i className="fa-solid fa-spinner fa-spin text-[10px]" />
                  : <i className="fa-solid fa-check text-[10px]" />}
                Thêm
              </button>
            </div>
          </div>
        )}

        {/* Draft list */}
        {isLoadingDrafts ? (
          <div className="flex items-center justify-center py-3">
            <svg className="w-4 h-4 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : drafts.length === 0 && !isAddingDraft ? (
          <p className="text-xs text-gray-400 text-center py-2">
            Chưa có tiêu chí riêng nào.
          </p>
        ) : (
          <div className="space-y-1.5">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/40 dark:bg-orange-900/10 dark:border-orange-800"
              >
                {editingId === d.id ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(d.id); if (e.key === 'Escape') cancelEdit(); }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-orange-300 bg-white dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(d.id); if (e.key === 'Escape') cancelEdit(); }}
                      placeholder="Mô tả (tùy chọn)..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-sm text-gray-500 dark:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-2.5 py-1 text-[11px] text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(d.id)}
                        disabled={!editName.trim() || isUpdating}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {isUpdating
                          ? <i className="fa-solid fa-spinner fa-spin text-[9px]" />
                          : <i className="fa-solid fa-check text-[9px]" />}
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{d.name}</p>
                      {d.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{d.description}</p>
                      )}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(d.id, d.name, d.description ?? null)}
                          className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <i className="fa-solid fa-pen text-[11px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Xóa"
                        >
                          {deletingId === d.id
                            ? <i className="fa-solid fa-spinner fa-spin text-[11px]" />
                            : <i className="fa-solid fa-trash text-[11px]" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CriteriaAssignment;
