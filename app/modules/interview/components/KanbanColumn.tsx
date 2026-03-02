import React, { useState } from 'react';
import CandidateCard from './CandidateCard';
import type { CandidateCardData } from './CandidateCard';

interface KanbanColumnProps {
  title: string;
  status: string;
  color: string;
  icon: React.ReactNode;
  cards: CandidateCardData[];
  onDrop: (data: CandidateCardData, targetStatus: string) => void;
  onViewDetail?: (data: CandidateCardData) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  color,
  icon,
  cards,
  onDrop,
  onViewDetail,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set false if actually leaving the column (not entering a child)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData('application/json');
      const data: CandidateCardData = JSON.parse(raw);
      onDrop(data, status);
    } catch {
      // ignore invalid drops
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl transition-all duration-300 min-w-[280px] max-w-[320px] flex-1 ${
        isDragOver
          ? 'ring-2 ring-orange-400 ring-offset-2 bg-orange-50/50 scale-[1.01]'
          : 'bg-gray-50/80'
      }`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${color}`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-sm text-white">{title}</h3>
        </div>
        <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center">
          {cards.length}
        </span>
      </div>

      {/* Cards container */}
      <div className={`flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin transition-all duration-200 ${
        isDragOver ? 'min-h-[120px]' : 'min-h-[80px]'
      }`}>
        {cards.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed transition-all duration-200 ${
            isDragOver
              ? 'border-orange-300 bg-orange-50/80'
              : 'border-gray-200 bg-white/50'
          }`}>
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-xs text-gray-400 font-medium">
              {isDragOver ? 'Thả vào đây' : 'Chưa có ứng viên'}
            </p>
          </div>
        ) : (
          cards.map((card, index) => (
            <div
              key={card.interview?.id || card.application?.applicationId || index}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CandidateCard data={card} onViewDetail={onViewDetail} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
