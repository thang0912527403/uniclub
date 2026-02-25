import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetInterviewsQuery } from '~/cores/api';
import type { InterviewScheduleResponse } from '~/cores/api';

interface InterviewStatusTrackerProps {
  userId: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string; step: number }> = {
  Scheduled:   { label: 'Đã lên lịch',     color: 'text-blue-700',    bgColor: 'bg-blue-100 border-blue-200',     icon: '📅', step: 1 },
  Confirmed:   { label: 'Đã xác nhận',     color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-200', icon: '✅', step: 2 },
  InProgress:  { label: 'Đang phỏng vấn',  color: 'text-amber-700',   bgColor: 'bg-amber-100 border-amber-200',   icon: '🎙️', step: 3 },
  Completed:   { label: 'Hoàn thành',      color: 'text-green-700',   bgColor: 'bg-green-100 border-green-200',   icon: '🏆', step: 4 },
  Cancelled:   { label: 'Đã hủy',          color: 'text-red-700',     bgColor: 'bg-red-100 border-red-200',       icon: '❌', step: -1 },
  Rescheduled: { label: 'Đã dời lịch',     color: 'text-purple-700',  bgColor: 'bg-purple-100 border-purple-200', icon: '🔄', step: 1 },
};

const InterviewStatusTracker: React.FC<InterviewStatusTrackerProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: allInterviews = [], isLoading } = useGetInterviewsQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filter interviews where this user is the candidate
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
          📋 Lịch phỏng vấn của tôi
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Bạn chưa có lịch phỏng vấn nào.</p>
          <p className="text-gray-400 text-xs mt-1">Khi được mời phỏng vấn, thông tin sẽ hiển thị tại đây.</p>
        </div>
      </div>
    );
  }

  // Stats
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
                  {isCancelled ? '✕' : isActive ? '✓' : s.step}
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
          📋 Lịch phỏng vấn của tôi
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
            const isUpcoming = ['Scheduled', 'Confirmed', 'Rescheduled'].includes(interview.status);
            const hasRoom = !!interview.meetingRoom;

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
                      <span className="text-base">{cfg.icon}</span>
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{interview.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-[#f26522]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(interview.scheduledAt).toLocaleDateString('vi-VN', {
                          weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span>•</span>
                      <span>{interview.durationMinutes} phút</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${cfg.bgColor} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Progress bar */}
                {renderProgressSteps(interview)}

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-3 animate-fadeIn">
                    {interview.description && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{interview.description}</p>
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
                              {a.hasConfirmed && <span className="text-green-500 text-[10px]">✓</span>}
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
                                {a.score != null && (
                                  <span className={`text-xs font-bold ${
                                    a.score >= 70 ? 'text-green-600' : a.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>{a.score}/100</span>
                                )}
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

                    {/* Room access */}
                    {hasRoom && interview.status === 'InProgress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/interview/room/${interview.meetingRoom!.roomCode}`);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-[#f26522] to-orange-500 text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Vào phòng phỏng vấn ({interview.meetingRoom!.roomCode})
                      </button>
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
