import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useNavigate } from "react-router";
import {
  useGetCampaignComparisonQuery,
  useGetCampaignCriteriaQuery,
  useSubmitDecisionsMutation,
  useGetAiAnalysisQuery,
  useAiSearchMutation,
  useGetEvaluationSummaryQuery,
  useGetPublishStatusQuery,
  useGenerateAiAnalysisMutation,
} from "~/cores/api/interviewApi";
import { useGetUserByIdQuery } from "~/cores/api";
import { useGetRecruitmentCampaignQuery } from "~/cores/api/recruitmentCampaignApi";
import { getUserId } from "~/utils/auth";
import PublishResultModal from "./PublishResultModal";
import type {
  CandidateComparisonItem,
  AiCandidateAnalysis,
  AiCriteriaEvaluation,
  AiSearchCandidate,
  CriteriaNoteResult,
} from "~/cores/api/types";

interface CandidateComparisonPageProps {
  campaignId: number;
}

// ═══════════════════════════════════════════════════════════════
//  Helper UI functions
// ═══════════════════════════════════════════════════════════════

type CriteriaResult = "Pass" | "Fail" | "Hold";

function getResultLabel(result: string): {
  text: string;
  color: string;
  bg: string;
} {
  const r = result?.toLowerCase() || "";
  if (r === "pass")
    return {
      text: "Đạt",
      color: "text-green-700",
      bg: "bg-green-100 border-green-200",
    };
  if (r === "fail")
    return {
      text: "Loại",
      color: "text-red-700",
      bg: "bg-red-100 border-red-200",
    };
  if (r === "hold")
    return {
      text: "Đang chờ",
      color: "text-yellow-700",
      bg: "bg-yellow-100 border-yellow-200",
    };
  return {
    text: result || "Chưa rõ",
    color: "text-gray-500",
    bg: "bg-gray-100 border-gray-200",
  };
}

// ═══════════════════════════════════════════════════════════════
//  Reusable Components
// ═══════════════════════════════════════════════════════════════

const UserName: React.FC<{ userId: string; fallback?: string }> = ({
  userId,
  fallback,
}) => {
  const { data: user, isFetching } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });
  if (isFetching)
    return <span className="text-gray-400 text-xs animate-pulse">...</span>;
  return <>{user?.fullName || fallback || userId.slice(0, 8) + "…"}</>;
};

const ResultIcon: React.FC<{ result: CriteriaResult }> = ({ result }) => {
  if (result === "Pass") {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 transition-transform hover:scale-110">
        <i className="fa-solid fa-check text-xs" />
      </span>
    );
  }
  if (result === "Fail") {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-500 transition-transform hover:scale-110">
        <i className="fa-solid fa-xmark text-xs" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400 transition-transform hover:scale-110">
      <span className="text-xs">—</span>
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
//  AI Search Result Badge
// ═══════════════════════════════════════════════════════════════
const AiSearchBadge: React.FC<{ match: AiSearchCandidate }> = ({ match }) => (
  <div className="flex items-center gap-2 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
    <i className="fa-solid fa-bullseye text-violet-500 text-[10px]" />
    <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
      Match: {match.matchScore}%
    </span>
    <span className="text-[10px] text-violet-500 dark:text-violet-400 truncate max-w-[200px]">
      {match.reason}
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════
//  Candidate Row (with expandable AI summary from backend)
// ═══════════════════════════════════════════════════════════════

const CandidateRow: React.FC<{
  candidate: CandidateComparisonItem;
  rowIdx: number;
  criteria: { id: number; name: string }[];
  decision: string;
  onDecision: (scheduleId: number, decision: string) => void;
  aiData?: AiCandidateAnalysis;
  aiLoading?: boolean;
  searchMatch?: AiSearchCandidate;
  isLocked?: boolean;
}> = ({
  candidate,
  rowIdx,
  criteria,
  decision,
  onDecision,
  aiData,
  aiLoading,
  searchMatch,
  isLocked,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notesPopover, setNotesPopover] = useState<{
    criterionId: number;
    criterionName: string;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch evaluation summary (contains interviewer notes from DB)
  const { data: evalSummary } = useGetEvaluationSummaryQuery(
    candidate.interviewScheduleId,
  );

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setNotesPopover(null);
      }
    };
    if (notesPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notesPopover]);

  // Build per-criteria evaluation map from AI backend data
  const aiCriteriaMap = useMemo(() => {
    if (!aiData?.criteriaEvaluations) return {};
    const map: Record<number, AiCriteriaEvaluation> = {};
    for (const ca of aiData.criteriaEvaluations) {
      map[ca.criterionId] = ca;
    }
    return map;
  }, [aiData]);

  // Build per-criteria notes map from evaluation summary
  const criteriaNotesMap = useMemo(() => {
    if (!evalSummary?.criteriaSummaries) return {};
    const map: Record<number, CriteriaNoteResult[]> = {};
    for (const cs of evalSummary.criteriaSummaries) {
      map[cs.criterionId] = cs.individualNotes;
    }
    return map;
  }, [evalSummary]);

  const aiResult = getResultLabel(aiData?.result || "");

  return (
    <>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className={`border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
          searchMatch
            ? "ring-2 ring-violet-300 dark:ring-violet-600 ring-inset"
            : ""
        } ${
          isExpanded
            ? "bg-blue-50/50 dark:bg-blue-900/10"
            : rowIdx % 2 === 0
              ? "hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
              : "bg-gray-50/30 dark:bg-gray-800/30 hover:bg-gray-100/80 dark:hover:bg-gray-700/40"
        }`}
      >
        {/* Avatar + Name */}
        <td className="px-4 py-3.5 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
              {candidate.title.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                <UserName
                  userId={candidate.candidateUserId}
                  fallback={candidate.title}
                />
              </p>
              {searchMatch && <AiSearchBadge match={searchMatch} />}
            </div>
          </div>
        </td>

        {/* Criteria result icons from AI - clickable to show notes */}
        {criteria.map((c) => {
          const ca = aiCriteriaMap[c.id];
          const notes = criteriaNotesMap[c.id] || [];
          const isOpen = notesPopover?.criterionId === c.id;
          return (
            <td
              key={c.id}
              className="px-3 py-3.5 text-center border-r border-gray-200 dark:border-gray-700 relative"
            >
              {aiLoading ? (
                <span className="inline-block w-7 h-7 rounded-full bg-gray-100 animate-pulse" />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotesPopover(
                      isOpen
                        ? null
                        : { criterionId: c.id, criterionName: c.name },
                    );
                  }}
                  className="relative cursor-pointer"
                  title={`Xem nhận xét: ${c.name}`}
                >
                  <ResultIcon result={ca?.result || "Hold"} />
                </button>
              )}

              {/* Notes Popover */}
              {isOpen && (
                <div
                  ref={popoverRef}
                  className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 p-3 animate-fadeIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Arrow */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-600 rotate-45" />

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-clipboard-list text-blue-500 text-[10px]" />
                      {notesPopover.criterionName}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotesPopover(null);
                      }}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <i className="fa-solid fa-xmark text-[9px] text-gray-400" />
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                      Chưa có nhận xét nào.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {notes.map((note, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 border border-gray-100 dark:border-gray-600"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-[7px] text-white font-bold">
                                {note.interviewerRole
                                  ?.charAt(0)
                                  ?.toUpperCase() || "I"}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                              <UserName userId={note.interviewerUserId} />
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-500 font-medium">
                              {note.interviewerRole}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed pl-5">
                            {note.note || (
                              <span className="italic text-gray-400">
                                Không có ghi chú
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </td>
          );
        })}

        {/* AI Result */}
        <td className="px-4 py-3.5 text-center border-r border-gray-200 dark:border-gray-700">
          {aiLoading ? (
            <div className="h-6 w-16 mx-auto bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${aiResult.bg} ${aiResult.color}`}
            >
              {aiResult.text}
            </span>
          )}
        </td>

        {/* Decision buttons */}
        <td
          className="px-4 py-3.5 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center gap-1.5">
            {[
              {
                value: "Accept",
                label: "DUYỆT",
                style:
                  "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
                active: "bg-blue-500 text-white border-blue-500",
              },
              {
                value: "Reject",
                label: "LOẠI",
                style: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
                active: "bg-red-500 text-white border-red-500",
              },
              {
                value: "Waitlist",
                label: "CHỜ",
                style:
                  "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                active: "bg-gray-500 text-white border-gray-500",
              },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  !isLocked &&
                  onDecision(candidate.interviewScheduleId, opt.value)
                }
                disabled={isLocked}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  decision === opt.value ? opt.active : opt.style
                } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </td>

        {/* Expand icon */}
        <td className="px-2 py-3.5 text-center w-10">
          <i
            className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </td>
      </tr>

      {/* Expanded AI Summary Row - powered by backend AI */}
      {isExpanded && (
        <tr className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-800/50">
          <td colSpan={criteria.length + 4} className="px-6 py-5">
            <div className="space-y-4 animate-fadeIn">
              {aiLoading ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span className="text-sm">Đang phân tích bằng AI...</span>
                </div>
              ) : !aiData ? (
                <p className="text-sm text-gray-400 italic">
                  Chưa có dữ liệu phân tích AI cho ứng viên này.
                </p>
              ) : (
                <>
                  {/* AI Result Header */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <i className="fa-solid fa-robot text-blue-500 text-xs" />
                        Kết quả AI
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${aiResult.bg} ${aiResult.color}`}
                        >
                          {aiResult.text}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  {(aiData.strengths?.length > 0 ||
                    aiData.weaknesses?.length > 0) && (
                    <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiData.strengths?.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1.5 flex items-center gap-1.5">
                            <i className="fa-solid fa-thumbs-up text-[10px]" />
                            Điểm mạnh
                          </p>
                          <ul className="space-y-1">
                            {aiData.strengths.map((s, i) => (
                              <li
                                key={i}
                                className="text-xs text-green-700 dark:text-green-300 flex items-start gap-1.5"
                              >
                                <i className="fa-solid fa-check text-[9px] mt-0.5 flex-shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiData.weaknesses?.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase mb-1.5 flex items-center gap-1.5">
                            <i className="fa-solid fa-triangle-exclamation text-[10px]" />
                            Cần cải thiện
                          </p>
                          <ul className="space-y-1">
                            {aiData.weaknesses.map((w, i) => (
                              <li
                                key={i}
                                className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1.5"
                              >
                                <i className="fa-solid fa-minus text-[9px] mt-0.5 flex-shrink-0" />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════════════════════

const CandidateComparisonPage: React.FC<CandidateComparisonPageProps> = ({
  campaignId,
}) => {
  const navigate = useNavigate();
  const {
    data: comparison,
    isLoading,
    error,
  } = useGetCampaignComparisonQuery(campaignId);
  const { data: criteria } = useGetCampaignCriteriaQuery(campaignId);
  const { data: campaign } = useGetRecruitmentCampaignQuery({ clubId: 0, id: campaignId });
  const { data: publishStatus } = useGetPublishStatusQuery(campaignId);
  const {
    data: aiAnalysis,
    isLoading: aiLoading,
    isFetching: aiFetching,
  } = useGetAiAnalysisQuery(campaignId);
  const [generateAiAnalysis, { isLoading: isGeneratingAi }] =
    useGenerateAiAnalysisMutation();
  const [aiSearch, { isLoading: aiSearchLoading }] = useAiSearchMutation();
  const [submitDecisions] = useSubmitDecisionsMutation();

  const [activeTab, setActiveTab] = useState<"pending" | "published">(
    "pending",
  );
  const [decisions, setDecisions] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    AiSearchCandidate[] | null
  >(null);
  const [isAiSearchMode, setIsAiSearchMode] = useState(false);

  // Pagination
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Build AI data map by interviewScheduleId
  const aiDataMap = useMemo(() => {
    if (!aiAnalysis?.candidates) return {};
    const map: Record<number, AiCandidateAnalysis> = {};
    for (const c of aiAnalysis.candidates) {
      map[c.interviewScheduleId] = c;
    }
    return map;
  }, [aiAnalysis]);

  // Build search result map
  const searchResultMap = useMemo(() => {
    if (!searchResults) return {};
    const map: Record<number, AiSearchCandidate> = {};
    for (const r of searchResults) {
      map[r.interviewScheduleId] = r;
    }
    return map;
  }, [searchResults]);

  // Filtered + paginated (when AI search active, only show matched candidates)
  const filteredCandidates = useMemo(() => {
    if (!comparison) return [];

    // When AI search results are active, filter & sort by match
    if (isAiSearchMode && searchResults) {
      const matchedIds = new Set(
        searchResults.map((r) => r.interviewScheduleId),
      );
      return comparison
        .filter((c) => matchedIds.has(c.interviewScheduleId))
        .sort((a, b) => {
          const scoreA =
            searchResultMap[a.interviewScheduleId]?.matchScore ?? 0;
          const scoreB =
            searchResultMap[b.interviewScheduleId]?.matchScore ?? 0;
          return scoreB - scoreA;
        });
    }

    // Normal text filter
    if (!searchQuery.trim()) return comparison;
    const q = searchQuery.toLowerCase();
    return comparison.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.candidateUserId.toLowerCase().includes(q),
    );
  }, [comparison, searchQuery, isAiSearchMode, searchResults, searchResultMap]);

  // Handle decisions coming from backend
  const publishedDecisionMap = useMemo(() => {
    if (!publishStatus?.decisions) return {};
    const map: Record<number, any> = {};
    for (const d of publishStatus.decisions) {
      map[d.interviewScheduleId] = d;
    }
    return map;
  }, [publishStatus]);

  // Tab filtering
  const tabFilteredCandidates = useMemo(() => {
    return filteredCandidates.filter((c) => {
      const dbDecision = publishedDecisionMap[c.interviewScheduleId];
      if (activeTab === "pending") {
        // Chưa có quyết định trên DB, hoặc có trên DB nhưng là Draft
        return !dbDecision || dbDecision.publishStatus === "Draft";
      } else {
        // Đã gửi quyết định hoặc Published
        return dbDecision && dbDecision.publishStatus !== "Draft";
      }
    });
  }, [filteredCandidates, activeTab, publishedDecisionMap]);

  const totalPages = Math.ceil(tabFilteredCandidates.length / PAGE_SIZE);
  const paginatedCandidates = tabFilteredCandidates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleDecision = useCallback((scheduleId: number, decision: string) => {
    setDecisions((prev) => {
      if (prev[scheduleId] === decision) {
        const next = { ...prev };
        delete next[scheduleId];
        return next;
      }
      return { ...prev, [scheduleId]: decision };
    });
  }, []);

  // AI Search handler
  const handleAiSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setIsAiSearchMode(false);
      setSearchResults(null);
      return;
    }
    try {
      const result = await aiSearch({
        campaignId,
        dto: { query: searchQuery },
      }).unwrap();
      setSearchResults(result.results);
      setIsAiSearchMode(true);
      setCurrentPage(1);
    } catch (err) {
      console.error("AI Search failed:", err);
    }
  }, [searchQuery, campaignId, aiSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    setIsAiSearchMode(false);
    setCurrentPage(1);
  }, []);

  const handleSubmitDecisions = async () => {
    setSubmitError(null);
    setSubmitSuccess(false);
    setSubmitting(true);

    const decisionItems = Object.entries(decisions).map(
      ([scheduleIdStr, decision]) => {
        const scheduleId = Number(scheduleIdStr);
        const candidate = comparison!.find(
          (c) => c.interviewScheduleId === scheduleId,
        );
        return {
          interviewScheduleId: scheduleId,
          candidateUserId: candidate?.candidateUserId || "",
          decision,
        };
      },
    );

    if (decisionItems.length === 0) {
      setSubmitError("Chưa có quyết định nào");
      setSubmitting(false);
      return;
    }

    try {
      await submitDecisions({
        campaignId,
        dto: { decidedByUserId: getUserId(), decisions: decisionItems },
      }).unwrap();
      setSubmitSuccess(true);
    } catch (err: unknown) {
      setSubmitError("Gửi quyết định thất bại");
      console.error("Failed to submit decisions:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="w-8 h-8 animate-spin text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (error)
    return (
      <div className="text-red-500 text-sm px-4 py-3 rounded-xl bg-red-50 border border-red-200">
        Không thể tải dữ liệu so sánh
      </div>
    );
  if (!comparison || comparison.length === 0)
    return (
      <div className="text-gray-500 text-sm px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
        Chưa có ứng viên nào được phỏng vấn
      </div>
    );

  const criteriaList = criteria || [];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 transition-all"
            title="Quay lại"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">
            Đánh giá ứng viên
          </h2>
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400">
            {campaign?.campaignName || `Chiến dịch #${campaignId}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmitDecisions}
            disabled={submitting || Object.keys(decisions).length === 0}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang gửi..." : "Gửi quyết định"}
          </button>
          <button
            onClick={() => setPublishOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-bullhorn text-xs" />
            Công bố kết quả
          </button>
          <button
            onClick={() => navigate("/interview/schedule")}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 transition-all"
            title="Lịch phỏng vấn"
          >
            <i className="fa-solid fa-calendar-days text-sm" />
          </button>
        </div>
      </div>

      {/* Description + AI Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="max-w-xl">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            So sánh ứng viên
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            Phân tích chuyên sâu dựa trên trí tuệ nhân tạo (AI) để so sánh năng
            lực, kỹ năng giao tiếp và mức độ phù hợp văn hóa của các ứng viên
            tiềm năng nhất.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => generateAiAnalysis(campaignId)}
            disabled={isGeneratingAi}
            className="px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingAi ? (
              <svg
                className="w-3.5 h-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <i className="fa-solid fa-bolt text-xs" />
            )}
            {"Phân tích AI"}
          </button>

          {/* AI Search Input */}
          <div className="relative">
            <i
              className={`fa-solid ${isAiSearchMode ? "fa-wand-magic-sparkles text-violet-500" : "fa-search text-gray-400"} absolute left-3 top-1/2 -translate-y-1/2 text-xs`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setIsAiSearchMode(false);
                  setSearchResults(null);
                }
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAiSearch();
              }}
              placeholder="Tìm kiếm bằng AI..."
              className={`pl-9 pr-10 py-2 rounded-xl border text-sm outline-none transition-all w-64 ${
                isAiSearchMode
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-200 focus:ring-2 focus:ring-violet-200"
                  : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              }`}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <i className="fa-solid fa-xmark text-[9px] text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
          <button
            onClick={handleAiSearch}
            disabled={aiSearchLoading || !searchQuery.trim()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiSearchLoading ? (
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Đang tìm...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles text-xs" />
                AI Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Search Status Banner */}
      {isAiSearchMode && searchResults && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-700">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-violet-500 text-sm" />
            <span className="text-sm text-violet-700 dark:text-violet-300 font-medium">
              AI tìm thấy <strong>{searchResults.length}</strong> ứng viên phù
              hợp với: "<em>{searchQuery}</em>"
            </span>
          </div>
          <button
            onClick={handleClearSearch}
            className="text-xs text-violet-500 hover:text-violet-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <i className="fa-solid fa-xmark text-[10px]" />
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* AI Analysis Loading Banner */}
      {(aiLoading || aiFetching) && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <svg
            className="w-4 h-4 animate-spin text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Đang tải phân tích AI cho toàn bộ ứng viên...
          </span>
        </div>
      )}

      {submitError && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">
          Quyết định đã được gửi thành công!
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-600">
              <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider min-w-[180px]">
                Ứng viên
              </th>
              {criteriaList.map((c) => (
                <th
                  key={c.id}
                  className="px-3 py-3 text-center font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-l border-gray-200 dark:border-gray-600 min-w-[80px]"
                >
                  {c.name}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-l border-gray-200 dark:border-gray-600 min-w-[100px]">
                Kết quả AI
              </th>
              <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-l border-gray-200 dark:border-gray-600 min-w-[200px]">
                Quyết định
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {paginatedCandidates.map((candidate, rowIdx) => {
              const dbDecision =
                publishedDecisionMap[candidate.interviewScheduleId];
              const isLocked =
                dbDecision && dbDecision.publishStatus !== "Draft";
              const currentDecision =
                decisions[candidate.interviewScheduleId] ||
                dbDecision?.decision ||
                "";

              return (
                <CandidateRow
                  key={candidate.interviewScheduleId}
                  candidate={candidate}
                  rowIdx={rowIdx}
                  criteria={criteriaList}
                  decision={currentDecision}
                  onDecision={handleDecision}
                  aiData={aiDataMap[candidate.interviewScheduleId]}
                  aiLoading={aiLoading || aiFetching}
                  searchMatch={searchResultMap[candidate.interviewScheduleId]}
                  isLocked={isLocked}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination + Stats */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Hiển thị {paginatedCandidates.length} trên {filteredCandidates.length}{" "}
          ứng viên trong chiến dịch này
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
            >
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  page === currentPage
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
            >
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>
        )}
      </div>

      {/* AI Insights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* AI Trends */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-5 border border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-chart-line text-blue-500" />
            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
              Xu hướng tài năng
            </h4>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-semibold">
              {campaign?.campaignName || `CAMPAIGN #${campaignId}`}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {aiAnalysis?.candidates && aiAnalysis.candidates.length > 0
              ? `Đã phân tích ${aiAnalysis.candidates.length} ứng viên bằng AI. AI đưa ra nhận xét và đề xuất cho từng ứng viên.`
              : comparison.length > 0
                ? `Có ${comparison.length} ứng viên. Đang chờ phân tích AI...`
                : "Chưa có dữ liệu để phân tích."}
          </p>
          {aiAnalysis?.analyzedAt && (
            <p className="text-[10px] text-gray-400 mt-1.5">
              Phân tích lần cuối:{" "}
              {new Date(aiAnalysis.analyzedAt).toLocaleString("vi-VN")}
            </p>
          )}
        </div>

        {/* AI Decision Support */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
            Cần hỗ trợ đưa ra quyết định?
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Hệ thống AI phân tích toàn bộ nhận xét của interviewer, tự động đánh
            giá theo tiêu chí và đưa ra gợi ý tuyển dụng. Sử dụng{" "}
            <strong>AI Search</strong> để tìm ứng viên phù hợp với yêu cầu cụ
            thể.
          </p>
        </div>
      </div>

      <PublishResultModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        campaignId={campaignId}
        clubId={campaign?.clubId}
        onSuccess={() => setPublishOpen(false)}
      />
    </div>
  );
};

export default CandidateComparisonPage;
