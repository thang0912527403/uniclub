import { useState } from 'react';

interface ApiStatus {
  name: string;
  isLoading: boolean;
}

interface ApiStatusButtonProps {
  apiStatuses: ApiStatus[];
  isDark?: boolean;
  onThemeToggle?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ApiStatusButton({ 
  apiStatuses, 
  isDark = true, 
  onThemeToggle,
  position = 'bottom-right' 
}: ApiStatusButtonProps) {
  const [showDetail, setShowDetail] = useState(false);

  const isAnyLoading = apiStatuses.some(api => api.isLoading);
  const allDone = apiStatuses.every(api => !api.isLoading);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col items-end gap-2`}>
      {/* API Status Detail Panel */}
      {showDetail && (
        <div 
          className={`${
            isDark ? 'bg-[#242838] border-gray-700' : 'bg-white border-gray-200'
          } border rounded-lg shadow-2xl p-4 w-64 animate-in slide-in-from-bottom-2`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              API Status
            </h3>
            <button
              onClick={() => setShowDetail(false)}
              className={`text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="space-y-2">
            {apiStatuses.map((api, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      api.isLoading 
                        ? 'bg-yellow-500 animate-pulse' 
                        : 'bg-green-500'
                    }`}
                  ></div>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    {api.name}
                  </span>
                </div>
                <span className={`text-xs ${
                  api.isLoading 
                    ? 'text-yellow-500' 
                    : 'text-green-500'
                }`}>
                  {api.isLoading ? 'Loading...' : 'Done'}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total APIs</span>
              <span className={isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold'}>
                {apiStatuses.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Completed</span>
              <span className="text-green-500 font-semibold">
                {apiStatuses.filter(api => !api.isLoading).length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {/* Theme Toggle Button */}
        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            className={`w-12 h-12 rounded-full shadow-lg transition-all hover:scale-110 ${
              isDark 
                ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' 
                : 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
          </button>
        )}

        {/* API Status Button */}
        <button
          onClick={() => setShowDetail(!showDetail)}
          className={`px-4 h-12 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 ${
            isAnyLoading
              ? 'bg-yellow-500 text-white'
              : allDone
              ? 'bg-green-500 text-white'
              : 'bg-gray-500 text-white'
          }`}
          title="Click to view API details"
        >
          {isAnyLoading && (
            <i className="fas fa-spinner fa-spin"></i>
          )}
          {allDone && (
            <i className="fas fa-check-circle"></i>
          )}
          {!isAnyLoading && !allDone && (
            <i className="fas fa-circle"></i>
          )}
          <span className="text-sm font-medium">
            {isAnyLoading ? 'Loading' : allDone ? 'Done' : 'Idle'}
          </span>
        </button>
      </div>
    </div>
  );
}
