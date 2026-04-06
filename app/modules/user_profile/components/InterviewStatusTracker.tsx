import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { message, Modal } from 'antd';
import {
  useGetInterviewsQuery,
  useUpdateInterviewMutation,
  useUpdateInterviewStatusMutation,
  useConfirmTimeSlotMutation,
} from '~/cores/api';
import type { InterviewScheduleResponse } from '~/cores/api';


interface InterviewStatusTrackerProps {
  userId: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; step: number }> = {
  Scheduled:   { label: 'Đã lên lịch',     color: 'text-blue-700',    bgColor: 'bg-blue-100 border-blue-200',     step: 1 },
  Confirmed:   { label: 'Đã xác nhận',     color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-200', step: 2 },
  InProgress:  { label: 'Đang phỏng vấn',  color: 'text-amber-700',   bgColor: 'bg-amber-100 border-amber-200',   step: 3 },
  Completed:   { label: 'Hoàn thành',      color: 'text-green-700',   bgColor: 'bg-green-100 border-green-200',   step: 4 },
  Cancelled:   { label: 'Đã hủy',          color: 'text-red-700',     bgColor: 'bg-red-100 border-red-200',       step: -1 },
  Rescheduled: { label: 'Đã dời lịch',     color: 'text-purple-700',  bgColor: 'bg-purple-100 border-purple-200', step: 1 },
};

// SVG Icons
const CalendarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const ClockIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CheckIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const VideoIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const ClipboardIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const ChevronDownIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const LockIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const InterviewStatusTracker: React.FC<InterviewStatusTrackerProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: allInterviews = [], isLoading } = useGetInterviewsQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updateInterviewApi] = useUpdateInterviewMutation();
  const [updateStatusApi] = useUpdateInterviewStatusMutation();
  const [confirmTimeSlotApi] = useConfirmTimeSlotMutation();
  const [pickingSlotId, setPickingSlotId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [localSelectedSlot, setLocalSelectedSlot] = useState<Record<number, number>>({});
  


  // Pick a slot locally
  const handlePickSlot = (interviewId: number, slotIdx: number) => {
    setLocalSelectedSlot(prev => ({ ...prev, [interviewId]: slotIdx }));
  };

  // Confirm schedule (one-time action => locks slot picker)
  const handleConfirmSchedule = async (interviewId: number, slotLabel: string, timeSlotId?: number) => {
    Modal.confirm({
      title: 'Xác nhận lịch phỏng vấn',
      content: (
        <div>
          <p className="text-gray-600 mb-2">Bạn chắc chắn muốn xác nhận khung giờ này?</p>
          <div className="bg-orange-50 text-orange-700 font-medium rounded-lg px-3 py-2 text-sm border border-orange-200">
            {slotLabel}
          </div>
          <p className="text-xs text-gray-400 mt-2">Sau khi xác nhận, bạn sẽ không thể thay đổi lại.</p>
        </div>
      ),
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#f26522', borderColor: '#f26522' } },
      async onOk() {
        setConfirmingId(interviewId);
        try {
          if (timeSlotId) {
            // New way: Confirm time slot via API
            await confirmTimeSlotApi({ scheduleId: interviewId, dto: { timeSlotId } }).unwrap();
          } else {
            // Legacy fallback: Just update status to Confirmed
            await updateStatusApi({ id: interviewId, dto: { status: 'Confirmed' } }).unwrap();
          }
          message.success('Đã xác nhận lịch phỏng vấn thành công!');
        } catch {
          message.error('Xác nhận thất bại, vui lòng thử lại.');
        } finally {
          setConfirmingId(null);
        }
      },
    });
  };

  const myInterviews = useMemo(() => {
    return allInterviews.filter(iv => iv.candidateUserId === userId);
  }, [allInterviews, userId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (myInterviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
          <ClipboardIcon className="w-5 h-5 text-[#f26522]" />
          Lịch phỏng vấn của tôi
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <CalendarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Bạn chưa có lịch phỏng vấn nào.</p>
          <p className="text-gray-400 text-xs mt-1">Khi được mời phỏng vấn, thông tin sẽ hiển thị tại đây.</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: myInterviews.length,
    upcoming: myInterviews.filter(i => ['Scheduled', 'Confirmed', 'Rescheduled'].includes(i.status)).length,
    inProgress: myInterviews.filter(i => i.status === 'InProgress').length,
    completed: myInterviews.filter(i => i.status === 'Completed').length,
    cancelled: myInterviews.filter(i => i.status === 'Cancelled').length,
  };

  const renderProgressSteps = (interview: InterviewScheduleResponse) => {
    const cfg = statusConfig[interview.status];
    const currentStep = cfg?.step ?? 0;
    const isCancelled = interview.status === 'Cancelled';
    const steps = [
      { step: 1, label: 'Lên lịch' },
      { step: 2, label: 'Xác nhận' },
      { step: 3, label: 'Phỏng vấn' },
      { step: 4, label: 'Hoàn thành' },
    ];

    return (
      <div className="flex items-center w-full mt-3">
        {steps.map((s, i) => {
          const isActive = !isCancelled && currentStep >= s.step;
          const isCurrent = !isCancelled && currentStep === s.step;
          return (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCancelled ? 'bg-red-100 text-red-400 border-2 border-red-200' :
                  isActive ? 'bg-[#f26522] text-white shadow-md shadow-orange-200' :
                  'bg-gray-100 text-gray-400 border-2 border-gray-200'
                } ${isCurrent ? 'ring-2 ring-orange-300 ring-offset-1' : ''}`}>
                  {isCancelled ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : isActive ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.step}
                </div>
                <span className={`text-[10px] mt-1 whitespace-nowrap ${
                  isActive ? 'text-gray-700 font-medium' : 'text-gray-400'
                }`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                  isCancelled ? 'bg-red-100' :
                  !isCancelled && currentStep > s.step ? 'bg-[#f26522]' :
                  'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <ClipboardIcon className="w-5 h-5 text-[#f26522]" />
          Lịch phỏng vấn của tôi
          <span className="bg-[#f26522] text-white text-xs px-2 py-0.5 rounded-full font-semibold">{stats.total}</span>
        </h3>
      </div>

      {/* Quick Stats */}
      <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
        <div className="flex gap-4">
          {[
            { label: 'Sắp tới', value: stats.upcoming, color: 'text-blue-600 bg-blue-50' },
            { label: 'Đang diễn ra', value: stats.inProgress, color: 'text-amber-600 bg-amber-50' },
            { label: 'Hoàn thành', value: stats.completed, color: 'text-green-600 bg-green-50' },
            { label: 'Đã hủy', value: stats.cancelled, color: 'text-red-600 bg-red-50' },
          ].filter(s => s.value > 0).map((stat) => (
            <div key={stat.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${stat.color}`}>
              <span className="text-base font-bold">{stat.value}</span>
              {stat.label}
            </div>
          ))}
        </div>
      </div>

      {/* Interview List */}
      <div className="divide-y divide-gray-50">
        {myInterviews
          .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
          .map((interview) => {
            const cfg = statusConfig[interview.status] || statusConfig.Scheduled;
            const isExpanded = expandedId === interview.id;
            const isScheduled = interview.status === 'Scheduled';
            const isConfirmed = interview.status === 'Confirmed';
            const isUpcoming = ['Scheduled', 'Confirmed', 'Rescheduled'].includes(interview.status);
            const hasRoom = !!interview.meetingRoom;
            const cleanDescription = interview.description?.trim() || '';
            
            // Unified slots list from DB
            const unifiedSlots = (interview.proposedTimeSlots && interview.proposedTimeSlots.length > 0)
              ? interview.proposedTimeSlots.map(s => {
                  const d = new Date(s.proposedAt);
                  const dateStr = d.toISOString().split('T')[0];
                  const timeStr = d.toTimeString().slice(0, 5); 
                  return { id: s.id, date: dateStr, time: timeStr, isSelected: s.isSelected };
                })
              : [];

            const hasMultipleSlots = unifiedSlots.length > 1;

            // Determine selected slot index using local state first
            // If already confirmed in DB, it might be reflected in unifiedSlots
            const dbSelectedIndex = unifiedSlots.findIndex(s => s.isSelected);
            const localIdx = localSelectedSlot[interview.id];
            
            const selectedSlotIndex = hasMultipleSlots
              ? (localIdx !== undefined
                  ? localIdx
                  : dbSelectedIndex >= 0 
                      ? dbSelectedIndex 
                      : unifiedSlots.findIndex(slot => {
                          const slotMs = new Date(`${slot.date}T${slot.time}`).getTime();
                          const schedMs = new Date(interview.scheduledAt).getTime();
                          return Math.abs(slotMs - schedMs) < 60000;
                        }))
              : -1;
            const hasPickedSlot = selectedSlotIndex >= 0;

            // Confirmed slot label for modal
            const confirmedSlotLabel = hasPickedSlot
              ? (() => {
                  const slot = unifiedSlots[selectedSlotIndex];
                  return new Date(`${slot.date}T${slot.time}`).toLocaleDateString('vi-VN', {
                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  });
                })()
              : new Date(interview.scheduledAt).toLocaleDateString('vi-VN', {
                  weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                });
            
            const selectedSlotId = hasPickedSlot ? unifiedSlots[selectedSlotIndex]?.id : undefined;

            return (
              <div
                key={interview.id}
                className={`px-6 py-4 hover:bg-gray-50/80 transition-colors cursor-pointer ${
                  isUpcoming ? 'bg-orange-50/30' : ''
                }`}
                onClick={() => setExpandedId(isExpanded ? null : interview.id)}
              >
                {/* Main row */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="w-4 h-4 text-[#f26522] flex-shrink-0" />
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{interview.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#f26522]" />
                        {new Date(interview.scheduledAt).toLocaleDateString('vi-VN', {
                          weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {interview.durationMinutes} phút
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {/* Awaiting pick badge */}
                    {isScheduled && hasMultipleSlots && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-full border border-amber-200 animate-pulse">
                        <CalendarIcon className="w-3 h-3" />
                        Chờ chọn giờ
                      </span>
                    )}
                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${cfg.bgColor} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Progress bar */}
                {renderProgressSteps(interview)}

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-3 animate-fadeIn" onClick={e => e.stopPropagation()}>
                    {cleanDescription && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{cleanDescription}</p>
                    )}

                    {/* ─── Slot Picker (only when Scheduled) ─── */}
                    {hasMultipleSlots && isScheduled && (
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-[#f26522] flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Chọn khung giờ phỏng vấn</p>
                            <p className="text-[11px] text-gray-500">Chọn thời gian phù hợp rồi xác nhận ({unifiedSlots.length} lựa chọn)</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {unifiedSlots.map((slot, idx) => {
                            const slotDate = new Date(`${slot.date}T${slot.time}`);
                            const isSelected = idx === selectedSlotIndex;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (idx !== selectedSlotIndex) {
                                    handlePickSlot(interview.id, idx);
                                  }
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                                  isSelected
                                    ? 'border-[#f26522] bg-white shadow-sm shadow-orange-100'
                                    : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                                    isSelected ? 'bg-[#f26522] text-white' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {isSelected ? (
                                      <CheckIcon className="w-4 h-4" />
                                    ) : idx + 1}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-semibold ${isSelected ? 'text-[#f26522]' : 'text-gray-700'}`}>
                                      {slotDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>
                                    <p className={`text-xs flex items-center gap-1 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`}>
                                      <ClockIcon className="w-3 h-3" />
                                      {slot.time} • {interview.durationMinutes} phút
                                    </p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#f26522] bg-orange-100 px-2.5 py-1 rounded-full">
                                    <CheckIcon className="w-3 h-3" />
                                    Đang chọn
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Confirm button — only shown after a slot is picked */}
                        {hasPickedSlot && (
                          <button
                            onClick={() => handleConfirmSchedule(interview.id, confirmedSlotLabel, selectedSlotId)}
                            disabled={confirmingId === interview.id}
                            className="mt-3 w-full py-3 bg-gradient-to-r from-[#f26522] to-orange-500 text-white font-bold rounded-xl text-sm hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Xác nhận lịch phỏng vấn
                          </button>
                        )}
                      </div>
                    )}

                    {/* Single-slot info when only 1 proposed — show as read-only for Scheduled */}
                    {isScheduled && !hasMultipleSlots && unifiedSlots.length === 1 && (() => {
                      const slot = unifiedSlots[0];
                      const slotDate = new Date(`${slot.date}T${slot.time}`);
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <CalendarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <p className="text-sm text-blue-700 font-medium">
                              Lịch phỏng vấn: {slotDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button
                            onClick={() => handleConfirmSchedule(interview.id, slotDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), slot.id)}
                            disabled={confirmingId === interview.id}
                            className="w-full py-3 bg-gradient-to-r from-[#f26522] to-orange-500 text-white font-bold rounded-xl text-sm hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Xác nhận lịch phỏng vấn
                          </button>
                        </div>
                      );
                    })()}

                    {/* Locked view after confirmed */}
                    {!isScheduled && unifiedSlots.length >= 1 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <LockIcon className="w-4 h-4 text-emerald-600" />
                          <p className="text-sm font-bold text-emerald-700">Lịch đã được xác nhận</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                          <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                          {new Date(interview.scheduledAt).toLocaleDateString('vi-VN', {
                            weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interviewers */}
                    {interview.assignments && interview.assignments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">Người phỏng vấn ({interview.assignments.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {interview.assignments.map(a => (
                            <div key={a.id} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
                                {a.interviewerUserId.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-[11px] text-gray-600 font-medium">{a.role}</span>
                              {a.hasConfirmed && (
                                <CheckIcon className="w-3 h-3 text-green-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback results */}
                    {interview.assignments?.some(a => a.feedbackSubmittedAt) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">Kết quả đánh giá</p>
                        <div className="grid grid-cols-2 gap-2">
                          {interview.assignments.filter(a => a.feedbackSubmittedAt).map(a => (
                            <div key={a.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                              <span className="text-xs text-gray-600">{a.role}</span>
                              <div className="flex items-center gap-2">
                                {a.result && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    a.result === 'Pass' ? 'bg-green-100 text-green-700' :
                                    a.result === 'Fail' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>{a.result}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cancel reason */}
                    {interview.status === 'Cancelled' && interview.cancelReason && (
                      <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 border border-red-100">
                        <span className="font-semibold">Lý do hủy:</span> {interview.cancelReason}
                      </div>
                    )}

                    {/* Room access — show for Confirmed and InProgress */}
                    {hasRoom && (isConfirmed || interview.status === 'InProgress') && (
                      <div className={`rounded-xl border p-4 ${
                        interview.status === 'InProgress'
                          ? 'bg-gradient-to-br from-[#f26522]/10 to-orange-50 border-orange-200'
                          : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs font-semibold uppercase mb-1 ${
                              interview.status === 'InProgress' ? 'text-orange-600' : 'text-blue-600'
                            }`}>Phòng phỏng vấn</p>
                            <p className="font-mono font-bold text-gray-800 text-base">{interview.meetingRoom!.roomCode}</p>
                          </div>
                          {interview.status === 'InProgress' ? (
                            <button
                              onClick={() => navigate(`/interview/room/${interview.meetingRoom!.roomCode}`)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#f26522] to-orange-500 text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all"
                            >
                              <VideoIcon className="w-4 h-4" />
                              Vào phòng
                            </button>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-medium">
                              <ClockIcon className="w-3.5 h-3.5" />
                              Chờ bắt đầu
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Custom animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default InterviewStatusTracker;
