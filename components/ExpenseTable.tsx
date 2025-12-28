
import React from 'react';
import { Transaction, Category } from '../types';

interface ExpenseTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const getCategoryStyles = (category: Category) => {
  switch (category) {
    case Category.FOOD: return 'bg-amber-500/10 text-amber-600 dark:text-amber-500';
    case Category.TRAVEL: return 'bg-blue-500/10 text-blue-600 dark:text-blue-500';
    case Category.FUN: return 'bg-pink-500/10 text-pink-600 dark:text-pink-500';
    case Category.ACADEMIC: return 'bg-violet-500/10 text-violet-600 dark:text-violet-500';
    default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400';
  }
};

const ExpenseTable: React.FC<ExpenseTableProps> = ({ transactions, onDelete }) => {
  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Merchant", "Category", "Type", "Amount"];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.merchant,
      t.category,
      t.type,
      t.amount.toFixed(2)
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `finances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Recent Transactions</h4>
        <button 
          onClick={exportToCSV}
          className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 border border-transparent"
        >
          <i className="fas fa-file-export"></i>
          Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Merchant</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                  No records found. Paste an alert above to classify.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 group cursor-default">
                  <td className="px-6 py-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${t.type === 'credit' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                      {t.merchant}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${getCategoryStyles(t.category)}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-black text-right ${t.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {t.type === 'credit' ? '+' : '-'} ₹{t.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;
