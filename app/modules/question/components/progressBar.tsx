import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm mb-10 sticky top-24 z-40 backdrop-blur-md bg-white/90">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Tiến độ hoàn thành</span>
        <span className="text-sm font-black text-[#FF6B00] bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
          {percent}%
        </span>
      </div>
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF9142] transition-all duration-700 ease-out rounded-full shadow-[0_0_12px_rgba(255,107,0,0.3)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;