import React from 'react';

export interface PipelineTab {
  key: string;
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

interface StatusPipelineTabsProps {
  tabs: PipelineTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const StatusPipelineTabs: React.FC<StatusPipelineTabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-1.5 shadow-sm">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          return (
            <React.Fragment key={tab.key}>
              {/* Connector arrow between tabs */}
              {index > 0 && (
                <div className="hidden sm:flex items-center px-0.5 text-gray-300 dark:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
              <button
                onClick={() => onTabChange(tab.key)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 whitespace-nowrap group
                  ${isActive
                    ? 'bg-gradient-to-r text-white shadow-md scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                  }
                `}
                style={isActive ? { backgroundImage: `linear-gradient(to right, ${tab.color}, ${tab.color}dd)` } : {}}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold
                    ${isActive
                      ? 'bg-white/25 text-white backdrop-blur-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StatusPipelineTabs;
