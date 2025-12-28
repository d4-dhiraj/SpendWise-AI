
import React, { useState, useEffect } from 'react';
import { Transaction, RunwayAnalysis } from '../types';
import { getFinancialRunwayAnalysis } from '../services/geminiService';

interface FinancialRunwayProps {
  transactions: Transaction[];
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

const FinancialRunway: React.FC<FinancialRunwayProps> = ({ transactions, balance, onUpdateBalance }) => {
  const [analysis, setAnalysis] = useState<RunwayAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBalance, setTempBalance] = useState(balance.toString());

  const fetchAnalysis = async () => {
    if (transactions.length < 3) return; // Need some data
    setLoading(true);
    try {
      const data = await getFinancialRunwayAnalysis(transactions, balance);
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [transactions, balance]);

  const handleBalanceSubmit = () => {
    const val = parseFloat(tempBalance);
    if (!isNaN(val)) {
      onUpdateBalance(val);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group transition-all">
      {/* Red Warning Light */}
      {analysis && analysis.warningLevel >= 7 && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-tighter">Danger Burn</span>
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Financial Runway</h4>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempBalance}
                    onChange={(e) => setTempBalance(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white text-lg font-bold w-24 outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button onClick={handleBalanceSubmit} className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-400">
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{balance.toLocaleString()}</h3>
                  <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 text-xs transition-colors">
                    <i className="fas fa-pen"></i>
                  </button>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold tracking-widest">Bank Balance</p>
          </div>
          
          <div className="text-right">
             <div className="text-3xl font-black text-indigo-600 dark:text-indigo-500">
               {loading ? <i className="fas fa-circle-notch fa-spin text-xl"></i> : analysis?.daysRemaining || '--'}
             </div>
             <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">Days Left</p>
          </div>
        </div>

        {analysis ? (
          <div className="space-y-4 animate-in fade-in duration-700">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                <span className="text-slate-500 dark:text-slate-400">Survival Progress</span>
                <span className={analysis.warningLevel > 7 ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}>
                  {analysis.burnRatePerDay.toFixed(1)}/day burn
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${analysis.warningLevel > 7 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.max(5, Math.min(100, (analysis.daysRemaining / 30) * 100))}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/50">
               <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase mb-1">
                 <i className="fas fa-calendar-day"></i>
                 Zero Day Projection
               </div>
               <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{new Date(analysis.zeroDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
               <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-2 leading-tight italic">
                 "{analysis.advice}"
               </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center italic">
              {transactions.length < 3 ? "Record at least 3 transactions for AI runway analysis..." : "Calculating your runway..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialRunway;
