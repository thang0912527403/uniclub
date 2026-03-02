import React from 'react';
import type { InterviewScheduleResponse, ApplicationResponseDto } from '~/cores/api';

export interface CandidateCardData {
  type: 'application' | 'interview';
  application?: ApplicationResponseDto;
  interview?: InterviewScheduleResponse;
}

interface CandidateCardProps {
  data: CandidateCardData;
  onViewDetail?: (data: CandidateCardData) => void;
}

const statusColors: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  Confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  InProgress: 'bg-amber-100 text-amber-700 border-amber-200',
  Completed: 'bg-green-100 text-green-700 border-green-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
  Rescheduled: 'bg-purple-100 text-purple-700 border-purple-200',
};

const resultIcons: Record<string, string> = {
  Pass: 'fa-solid fa-circle-check text-green-500',
  Fail: 'fa-solid fa-circle-xmark text-red-500',
  OnHold: 'fa-solid fa-clock text-yellow-500',
  NoShow: 'fa-solid fa-ban text-gray-400',
};

const CandidateCard: React.FC<CandidateCardProps> = ({ data, onViewDetail }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.5';
    el.style.transform = 'scale(0.95)';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
  };

  if (data.type === 'application' && data.application) {
    const app = data.application;
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-orange-200 transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {app.userId?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">Ứng viên</p>
              <p className="text-[10px] text-gray-400 font-mono">{app.userId?.slice(0, 8)}...</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
            Reviewed
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Form #{app.formId}</span>
          <span className="text-gray-300">•</span>
          <span>App #{app.applicationId}</span>
        </div>
        {app.reviewedAt && (
          <p className="text-[10px] text-gray-400 mt-2">
            Reviewed: {new Date(app.reviewedAt).toLocaleDateString('vi-VN')}
          </p>
        )}
      </div>
    );
  }

  if (data.type === 'interview' && data.interview) {
    const iv = data.interview;
    const hasRoom = !!iv.meetingRoom;
    const assignmentCount = iv.assignments?.length || 0;
    const feedbackCount = iv.assignments?.filter(a => a.feedbackSubmittedAt).length || 0;

    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onViewDetail?.(data)}
        className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-orange-200 transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 flex-1 mr-2">
            {iv.title}
          </h4>
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border whitespace-nowrap ${statusColors[iv.status] || 'bg-gray-100 text-gray-600'}`}>
            {iv.status}
          </span>
        </div>

        {iv.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{iv.description}</p>
        )}

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(iv.scheduledAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{iv.durationMinutes} phút</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3">
            {/* Interviewers */}
            <div className="flex items-center gap-1" title={`${assignmentCount} người phỏng vấn`}>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[11px] text-gray-500 font-medium">{assignmentCount}</span>
            </div>
            {/* Feedback progress */}
            {assignmentCount > 0 && (
              <div className="flex items-center gap-1" title={`${feedbackCount}/${assignmentCount} đã chấm`}>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-[11px] text-gray-500 font-medium">{feedbackCount}/{assignmentCount}</span>
              </div>
            )}
          </div>

          {/* Room badge */}
          {hasRoom && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full border border-green-200">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-green-700">{iv.meetingRoom!.roomCode}</span>
            </div>
          )}
        </div>

        {/* Feedback results */}
        {iv.assignments && iv.assignments.some(a => a.result) && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
            {iv.assignments.filter(a => a.result).map((a, i) => (
              <span key={i} title={`${a.result} - ${a.score ?? 'N/A'}/100`}>
                <i className={`${resultIcons[a.result!]} text-sm`}></i>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default CandidateCard;
