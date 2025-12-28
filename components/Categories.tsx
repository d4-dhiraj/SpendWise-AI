import React from 'react';
import { Category } from '../types';

const Categories: React.FC = () => {
  const categories = Object.values(Category);

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Categories</h3>
      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => (
          <div key={cat} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{cat}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage rules and mapping</p>
              </div>
              <div className="text-indigo-600 dark:text-indigo-400 text-xl">
                <i className="fas fa-tags"></i>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
