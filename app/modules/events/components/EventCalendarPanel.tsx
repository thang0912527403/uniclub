/**
 * EventCalendarPanel v2 — FullCalendar với 4 loại block:
 *  1. Main Event bg  (gray background)   — safe zone, không kéo được
 *  2. Main Event     (xanh dương)         — label kéo/resize
 *  3. Registration   (xanh lá allDay)     — đăng ký, không kéo
 *  4. Sessions       (tím/cam/vàng)       — kéo/resize/click để sửa
 *
 * Tính năng mới v2:
 *   - selectable: kéo chọn vùng thời gian → gọi onSessionCreate
 *   - dateClick: click đơn vào ô trống    → gọi onSessionCreate (end = start+1h)
 *   - eventClick session block            → gọi onSessionClick
 *   - selectConstraint: giới hạn kéo trong khung giờ event
 *   - selectOverlap: không cho kéo đè lên session đã có
 *   - Màu session theo type: main=tím, setup=cam, break=vàng
 */

import { useRef, useState } from 'react';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventDropArg, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';

// DateClickArg không được export trực tiếp — dùng inline type
type DateClickArg = { date: Date; allDay: boolean; jsEvent: MouseEvent };

// ─────────────────────── Public Types ────────────────────────

export interface CalendarMainEvent {
    title: string;
    start: string;   // ISO string
    end: string;
}

export interface CalendarRegistration {
    start: string;
    end: string;
}

export type SessionType = 'main' | 'setup' | 'break';

export interface CalendarSession {
    /** negative = unsaved draft, positive = saved */
    id: number;
    title: string;
    start: string;
    end: string;
    sessionType?: SessionType;
}

/** Single source of truth synced between Form ↔ Calendar */
export interface CalendarState {
    mainEvent?: CalendarMainEvent | null;
    registration?: CalendarRegistration | null;
    sessions: CalendarSession[];
}

// ─────────────────────── Constants ─────────────────────────────

const COLORS = {
    mainEvent: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
    mainEventBg: 'rgba(100,116,139,0.12)',   // safe-zone background
    registration: { bg: '#22c55e', border: '#16a34a', text: '#ffffff' },
    session: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' }, // main → tím
    sessionSetup: { bg: '#f97316', border: '#ea580c', text: '#ffffff' }, // setup → cam
    sessionBreak: { bg: '#eab308', border: '#ca8a04', text: '#111827' }, // break → vàng
};

function sessionIcon(type?: SessionType) {
    if (type === 'setup') return '🔧';
    if (type === 'break') return '☕';
    return '📌';
}

function sessionColor(type?: SessionType) {
    if (type === 'setup') return COLORS.sessionSetup;
    if (type === 'break') return COLORS.sessionBreak;
    return COLORS.session;
}

// helper: format ISO → "HH:mm DD/MM"
function fmtDateTime(iso: string) {
    try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    } catch { return iso; }
}

// ─────────────────────── Props ───────────────────────────────

interface EventCalendarPanelProps {
    state: CalendarState;

    /** Called when the main event block is dropped or resized. */
    onMainEventChange: (start: Date, end: Date, revert: () => void) => void | Promise<void>;

    /** Called when the registration block is dropped or resized. */
    onRegistrationChange: (start: Date, end: Date, revert: () => void) => void | Promise<void>;

    /** Called when a session block is dropped or resized. */
    onSessionChange: (id: number, start: Date, end: Date, revert: () => void) => void | Promise<void>;

    /**
     * Called when user kéo chọn vùng thời gian (selectable) hoặc click đơn.
     * Parent mở SessionQuickModal.
     */
    onSessionCreate?: (start: Date, end: Date) => void;

    /**
     * Called when user click vào session block.
     * Parent mở SessionQuickModal ở edit mode.
     */
    onSessionClick?: (id: number) => void;

    /**
     * Called when user drags on calendar in 'set-event' mode to set event start/end.
     */
    onSetEventTime?: (start: Date, end: Date) => void;

    /**
     * Called when user drags on calendar in 'set-reg' mode to set registration start/end.
     */
    onSetRegistrationTime?: (start: Date, end: Date) => void;

    /**
     * Giới hạn kéo chọn trong khung giờ Event (selectConstraint).
     * null = không giới hạn.
     */
    eventTimeConstraint?: { start: string; end: string } | null;

    isDark?: boolean;
}

// ─────────────────────── Component ───────────────────────────

export function EventCalendarPanel({
    state,
    onMainEventChange,
    onRegistrationChange,
    onSessionChange,
    onSessionCreate,
    onSessionClick,
    onSetEventTime,
    onSetRegistrationTime,
    eventTimeConstraint,
    isDark = false,
}: EventCalendarPanelProps) {
    const calendarRef = useRef<FullCalendar>(null);

    /** 3 chế độ: 'event' = đặt/di chuyển SK | 'session' = tạo phiên | 'registration' = đặt/di chuyển ĐK */
    const [calMode, setCalMode] = useState<'event' | 'session' | 'registration'>(
        onSetEventTime ? 'event' : 'session'
    );

    // ── Build event list ──────────────────────────────────
    const events: EventInput[] = [];

    if (state.mainEvent?.start && state.mainEvent?.end) {
        // Foreground — block lớn trong week/day view, editable theo calMode
        events.push({
            id: 'main',
            title: `🎯 ${state.mainEvent.title || 'Sự kiện'}`,
            start: state.mainEvent.start,
            end: state.mainEvent.end,
            backgroundColor: COLORS.mainEvent.bg,
            borderColor: COLORS.mainEvent.border,
            textColor: COLORS.mainEvent.text,
            editable: calMode === 'event',
            startEditable: calMode === 'event',
            durationEditable: calMode === 'event',
            classNames: ['unic-main-event'],
            extendedProps: { type: 'main', origStart: state.mainEvent.start, origEnd: state.mainEvent.end },
        });
    }

    if (state.registration?.start && state.registration?.end) {
        events.push({
            id: 'reg',
            title: `Đăng ký: ${fmtDateTime(state.registration.start)} → ${fmtDateTime(state.registration.end)}`,
            start: state.registration.start,
            end: state.registration.end,
            backgroundColor: COLORS.registration.bg,
            borderColor: COLORS.registration.border,
            textColor: COLORS.registration.text,
            // editable khi mode 'registration'
            editable: calMode === 'registration',
            startEditable: calMode === 'registration',
            durationEditable: calMode === 'registration',
            extendedProps: { type: 'registration' },
        });
    }

    // 3. Sessions — màu theo type
    state.sessions.forEach(s => {
        if (s.start && s.end) {
            const c = sessionColor(s.sessionType);
            events.push({
                id: `session-${s.id}`,
                title: `${sessionIcon(s.sessionType)} ${s.title || 'Phiên'}`,
                start: s.start,
                end: s.end,
                backgroundColor: c.bg,
                borderColor: c.border,
                textColor: c.text,
                extendedProps: { type: 'session', sessionId: s.id, origStart: s.start, origEnd: s.end },
            });
        }
    });

    // ── Initial view anchor ───────────────────────────────
    const anchor =
        state.mainEvent?.start ||
        state.registration?.start ||
        state.sessions[0]?.start ||
        new Date().toISOString();

    const hasEvents = events.filter(e => e.display !== 'background').length > 0;

    // ── eventDrop ─────────────────────────────────────────
    const handleEventDrop = async (info: EventDropArg) => {
        const { type, sessionId } = info.event.extendedProps ?? {};
        const start = info.event.start!;
        const end = info.event.end ?? new Date(start.getTime() + 3_600_000);

        try {
            if (type === 'main') {
                await onMainEventChange(start, end, info.revert);
            } else if (type === 'registration') {
                await onRegistrationChange(start, end, info.revert);
            } else if (type === 'session' && sessionId != null) {
                await onSessionChange(sessionId, start, end, info.revert);
            } else {
                info.revert();
            }
        } catch {
            info.revert();
        }
    };

    // ── eventResize ───────────────────────────────────────
    const handleEventResize = async (info: EventResizeDoneArg) => {
        const { type, sessionId } = info.event.extendedProps ?? {};
        const start = info.event.start!;
        const end = info.event.end!;

        try {
            if (type === 'main') {
                await onMainEventChange(start, end, info.revert);
            } else if (type === 'registration') {
                await onRegistrationChange(start, end, info.revert);
            } else if (type === 'session' && sessionId != null) {
                await onSessionChange(sessionId, start, end, info.revert);
            } else {
                info.revert();
            }
        } catch {
            info.revert();
        }
    };

    // ── dateSelect (kéo chọn vùng) — dispatch theo calMode ──
    const handleDateSelect = (info: DateSelectArg) => {
        calendarRef.current?.getApi().unselect();
        if (calMode === 'event') {
            onSetEventTime?.(info.start, info.end);
        } else if (calMode === 'registration') {
            onSetRegistrationTime?.(info.start, info.end);
        } else {
            onSessionCreate?.(info.start, info.end);
        }
    };

    // ── dateClick (click đơn vào ô trống) — dispatch theo calMode ──
    const handleDateClick = (info: DateClickArg) => {
        const end = new Date(info.date.getTime() + 3_600_000);
        if (calMode === 'event') {
            onSetEventTime?.(info.date, end);
        } else if (calMode === 'registration') {
            onSetRegistrationTime?.(info.date, end);
        } else if (onSessionCreate) {
            onSessionCreate(info.date, end);
        }
    };

    // ── eventClick ────────────────────────────────────────
    const handleEventClick = (info: EventClickArg) => {
        const { type, sessionId } = info.event.extendedProps ?? {};
        if (type !== 'session') return;  // bỏ qua bg/main/registration
        onSessionClick?.(sessionId);
    };

    // ── Styles ────────────────────────────────────────────
    const calBg = isDark ? '#1a1d2e' : '#ffffff';
    const calText = isDark ? '#e2e8f0' : '#1a202c';
    const border = isDark ? '#374151' : '#e5e7eb';

    // ── Legend items ──────────────────────────────────────
    const legend = [
        { color: 'bg-blue-500', label: 'Sự kiện' },
        { color: 'bg-green-500', label: 'Đăng ký' },
        { color: 'bg-purple-500', label: 'Phiên' },
        { color: 'bg-orange-400', label: 'Setup' },
        { color: 'bg-yellow-400', label: 'Nghỉ' },
    ];

    return (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>

            {/* Header + Legend */}
            <div className={`px-4 py-3 border-b flex items-center gap-3 flex-wrap ${isDark ? 'bg-[#242838] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <i className={`fas fa-calendar-alt ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Xem trên lịch
                </span>

                {/* Toggle mode */}
                {(onSessionCreate || onSetEventTime || onSetRegistrationTime) && (
                    <div className={`flex rounded-lg border overflow-hidden text-xs font-medium ml-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                        {onSetEventTime && (
                            <button
                                type="button"
                                onClick={() => setCalMode('event')}
                                className={`px-3 py-1.5 transition-colors ${calMode === 'event'
                                        ? 'bg-blue-500 text-white'
                                        : isDark ? 'bg-transparent text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Kéo đặt thời gian sự kiện hoặc kéo block xanh để di chuyển"
                            >
                                <i className="fas fa-calendar-alt mr-1" />Sự kiện
                            </button>
                        )}
                        {onSessionCreate && (
                            <button
                                type="button"
                                onClick={() => setCalMode('session')}
                                className={`px-3 py-1.5 transition-colors ${calMode === 'session'
                                        ? 'bg-purple-500 text-white'
                                        : isDark ? 'bg-transparent text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Kéo chọn vùng thời gian hoặc click để tạo phiên mới"
                            >
                                <i className="fas fa-plus mr-1" />Tạo phiên
                            </button>
                        )}
                        {(onSetRegistrationTime || true) && (
                            <button
                                type="button"
                                onClick={() => setCalMode('registration')}
                                className={`px-3 py-1.5 transition-colors ${calMode === 'registration'
                                        ? 'bg-green-500 text-white'
                                        : isDark ? 'bg-transparent text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Kéo đặt thời gian đăng ký hoặc kéo block xanh lá để di chuyển"
                            >
                                <i className="fas fa-user-plus mr-1" />Đăng ký
                            </button>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 ml-auto flex-wrap">
                    {legend.map(item => (
                        <span key={item.label} className="flex items-center gap-1.5 text-xs">
                            <span className={`w-3 h-3 rounded-sm ${item.color} inline-block`} />
                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{item.label}</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* Registration Alert Banner */}
            {state.registration?.start && state.registration?.end && (
                <div className={`px-4 py-2 flex items-center gap-2 text-xs border-b ${isDark
                        ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    }`}>
                    <i className="fas fa-calendar-check text-sm" />
                    <span>
                        <b>Đăng ký mở:</b>&nbsp;
                        {new Date(state.registration.start).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        &nbsp;→&nbsp;
                        {new Date(state.registration.end).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                </div>
            )}



            {/* FullCalendar */}
            <div style={{ background: calBg, color: calText }}>
                <style>{`
                    .unic-fc .fc { font-family: inherit; font-size: 0.82rem; }
                    .unic-fc .fc-toolbar-title { font-size: 0.95rem; font-weight: 600; color: ${calText}; }
                    .unic-fc .fc-button {
                        background: #3b82f6; border-color: #2563eb;
                        font-size: 0.72rem; padding: 3px 9px; border-radius: 6px;
                    }
                    .unic-fc .fc-button:hover { background: #2563eb; }
                    .unic-fc .fc-button-primary:not(:disabled).fc-button-active { background: #1d4ed8; }
                    .unic-fc .fc-col-header-cell-cushion,
                    .unic-fc .fc-daygrid-day-number { color: ${calText}; text-decoration: none; }
                    .unic-fc .fc-scrollgrid,
                    .unic-fc td, .unic-fc th { border-color: ${border}; }
                    .unic-fc .fc-timegrid-slot { height: 2.2rem; }
                    .unic-fc .fc-event {
                        border-radius: 5px; cursor: grab;
                        font-size: 0.75rem; font-weight: 500;
                    }
                    .unic-fc .fc-event:active { cursor: grabbing; }
                    .unic-fc .fc-event-resizer { opacity: 0.6; transition: opacity .15s; }
                    .unic-fc .fc-event-resizer:hover { opacity: 1; }
                    .unic-fc .fc-now-indicator-line { border-color: #ef4444; }
                    /* Main event block — thu hẹp bên phải để còn chỗ click tạo session */
                    .unic-fc .unic-main-event {
                        width: 28% !important;
                        right: 0 !important;
                        left: auto !important;
                        margin-left: auto !important;
                        opacity: 0.85;
                        font-size: 0.68rem !important;
                        writing-mode: vertical-rl;
                        text-orientation: mixed;
                        overflow: hidden;
                    }
                    .unic-fc .unic-main-event .fc-event-main {
                        padding: 4px 2px;
                        writing-mode: vertical-rl;
                    }
                    .unic-fc .fc-timegrid-now-indicator-arrow {
                        border-top-color: #ef4444; border-bottom-color: #ef4444;
                    }
                    .unic-fc .fc-event.fc-event-dragging { opacity: 0.6; }
                    .unic-fc .fc-event.fc-event-resizing  { opacity: 0.6; }
                     /* Highlight khi đang kéo chọn để tạo session */
                    .unic-fc .fc-highlight { background: rgba(139,92,246,0.18) !important; border: 2px dashed #8b5cf6 !important; }
                    /* Session có thể click */
                    .unic-fc [data-session="true"] { cursor: pointer !important; }
                    /* Background event (safe-zone) — full color, pointer-events:none nên không block tương tác */
                    .unic-fc .fc-bg-event { opacity: 1 !important; border-radius: 0; }
                `}</style>
                <div className="unic-fc">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        initialDate={anchor}
                        events={events}
                        // ─── Drag & Drop ───────────────────────────────
                        editable={true}
                        eventStartEditable={true}
                        eventDurationEditable={true}
                        droppable={true}
                        // ─── Select (tạo session / đặt event / đặt đăng ký) ──
                        selectable={!!(onSessionCreate || onSetEventTime || onSetRegistrationTime)}
                        selectMirror={true}
                        unselectAuto={true}
                        longPressDelay={300}
                        selectConstraint={calMode === 'session' ? (eventTimeConstraint ?? undefined) : undefined}
                        selectOverlap={(stillEvent) =>
                            calMode !== 'session' || (stillEvent.extendedProps?.type as string) !== 'session'
                        }
                        // ─── Handlers ─────────────────────────────────
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        select={handleDateSelect}
                        dateClick={handleDateClick}
                        eventClick={onSessionClick ? handleEventClick : undefined}
                        // ─── UI / locale ──────────────────────────────
                        locale="vi"
                        buttonText={{
                            today: 'Hôm nay',
                            month: 'Tháng',
                            week: 'Tuần',
                            day: 'Ngày',
                        }}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
                        }}
                        snapDuration="00:05:00"
                        slotDuration="00:30:00"
                        height="auto"
                        expandRows={true}
                        slotMinTime="05:00:00"
                        slotMaxTime="23:30:00"
                        nowIndicator={true}
                        allDaySlot={true}
                        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    />
                </div>
            </div>
        </div>
    );
}
