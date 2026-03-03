import React from 'react';

interface FilterProps {
  categories: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const PostFilter: React.FC<FilterProps> = ({ categories, activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-12 justify-center">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveTab(cat)}
          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
            activeTab === cat
              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 scale-105'
              : 'bg-white text-gray-600 border-gray-100 hover:border-orange-200 hover:text-orange-500'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default PostFilter;