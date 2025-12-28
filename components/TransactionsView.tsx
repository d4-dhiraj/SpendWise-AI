import React, { useState } from 'react';
import ExpenseTable from './ExpenseTable';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}

const TransactionsView: React.FC<Props> = ({ transactions, onDelete }) => {
  const [query, setQuery] = useState('');
  const filtered = transactions.filter(t =>
    `${t.merchant} ${t.category} ${t.rawSms}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transactions</h3>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search transactions..."
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm w-64"
        />
      </div>
      <div>
        <ExpenseTable transactions={filtered} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default TransactionsView;
