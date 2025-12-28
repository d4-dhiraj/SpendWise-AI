
import React from 'react';
import { Transaction } from '../types';

interface SummaryCardsProps {
  transactions: Transaction[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ transactions }) => {
  const totalSpent = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalIncome = transactions
    .filter(t => t.type === 'credit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const avgSpent = transactions.filter(t => t.type === 'debit').length > 0 
    ? totalSpent / transactions.filter(t => t.type === 'debit').length 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-500">
            <i className="fas fa-arrow-trend-down text-xl"></i>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total Spent</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Expenses</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{totalSpent.toFixed(2)}</h3>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-500">
            <i className="fas fa-arrow-trend-up text-xl"></i>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total Added</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Income/Credits</p>
        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalIncome.toFixed(2)}</h3>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-500">
            <i className="fas fa-chart-pie text-xl"></i>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Avg. Expense</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Avg. Ticket</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{avgSpent.toFixed(2)}</h3>
      </div>
    </div>
  );
};

export default SummaryCards;
