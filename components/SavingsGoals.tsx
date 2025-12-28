
import React, { useState, useEffect } from 'react';
import { Transaction, SavingsGoal, GoalStrategy } from '../types';
import { getSavingsGoalStrategy } from '../services/geminiService';

interface SavingsGoalsProps {
  transactions: Transaction[];
  currentUser?: { uid?: string } | null;
  onContribute?: (amount: number, title?: string) => void;
  onWithdraw?: (amount: number, title?: string) => void;
}

const SAVINGS_GOAL_KEY = 'student_savings_goal';
const PUBLIC_SAVINGS_GOAL_KEY = 'student_savings_goal_public';

const SavingsGoals: React.FC<SavingsGoalsProps> = ({ transactions, currentUser, onContribute, onWithdraw }) => {
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [strategy, setStrategy] = useState<GoalStrategy | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [contribAmount, setContribAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  useEffect(() => {
    const userKey = currentUser && currentUser.uid ? `${SAVINGS_GOAL_KEY}_${currentUser.uid}` : SAVINGS_GOAL_KEY;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      setGoal(JSON.parse(saved));
      return;
    }

    // if user has no personal goal, check for a public/shared goal to offer import
    const pub = localStorage.getItem(PUBLIC_SAVINGS_GOAL_KEY);
    if (pub) {
      // show public goal as preview but don't overwrite user's goal
      setSharedGoalAvailable(true);
    }
  }, [currentUser]);

  const [sharedGoalAvailable, setSharedGoalAvailable] = useState(false);

  useEffect(() => {
    const userKey = currentUser && currentUser.uid ? `${SAVINGS_GOAL_KEY}_${currentUser.uid}` : SAVINGS_GOAL_KEY;
    if (goal) {
      localStorage.setItem(userKey, JSON.stringify(goal));
      if (transactions.length > 2) {
        fetchStrategy();
      }
    } else {
      localStorage.removeItem(userKey);
      setStrategy(null);
    }
  }, [goal, transactions.length, currentUser]);

  const fetchStrategy = async () => {
    if (!goal) return;
    setLoading(true);
    try {
      const strat = await getSavingsGoalStrategy(transactions, goal.targetAmount - goal.currentSaved, goal.title);
      setStrategy(strat);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTarget);
    if (!newTitle || isNaN(amount)) return;

    setGoal({
      id: crypto.randomUUID(),
      title: newTitle,
      targetAmount: amount,
      currentSaved: 0
    });
    setIsAdding(false);
    setNewTitle('');
    setNewTarget('');
  };

  const handleContribute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goal) return;
    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) return;

    const updated: SavingsGoal = { ...goal, currentSaved: Math.min(goal.currentSaved + amt, goal.targetAmount) };
    setGoal(updated);
    setContribAmount('');
    if (onContribute) onContribute(amt, goal.title);
  };

  const handleWithdraw = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goal) return;
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;

    const updated: SavingsGoal = { ...goal, currentSaved: Math.max(0, goal.currentSaved - amt) };
    setGoal(updated);
    setWithdrawAmount('');
    if (onWithdraw) onWithdraw(amt, goal.title);
  };

  const handleMakePublic = () => {
    if (!goal) return;
    localStorage.setItem(PUBLIC_SAVINGS_GOAL_KEY, JSON.stringify(goal));
    setSharedGoalAvailable(false);
  };

  const handleImportPublic = () => {
    const pub = localStorage.getItem(PUBLIC_SAVINGS_GOAL_KEY);
    if (!pub) return;
    const parsed: SavingsGoal = JSON.parse(pub);
    setGoal({ ...parsed, id: crypto.randomUUID() });
    setSharedGoalAvailable(false);
  };

  const progress = goal ? (goal.currentSaved / goal.targetAmount) * 100 : 0;

  return (
    <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl h-full transition-all">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <i className="fas fa-bullseye text-indigo-500"></i>
          Savings Goals
        </h4>
        {!goal && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
          >
            <i className="fas fa-plus mr-1"></i> New Goal
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddGoal} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 mb-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">What are you saving for?</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g., New iPhone 15"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Target Amount (₹)</label>
            <input 
              type="number" 
              value={newTarget}
              onChange={e => setNewTarget(e.target.value)}
              placeholder="e.g., 10000"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20">Set Goal</button>
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {goal ? (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{goal.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">Target: ₹{goal.targetAmount.toLocaleString()}</p>
            </div>
            <button 
              onClick={() => setGoal(null)}
              className="text-slate-400 hover:text-rose-500 text-xs transition-colors"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${Math.max(2, progress)}%` }}
              ></div>
            </div>
          </div>

          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <label className="text-xs text-slate-500 block mb-2">Add to savings (₹)</label>
                <input
                  type="number"
                  value={contribAmount}
                  onChange={e => setContribAmount(e.target.value)}
                  placeholder="Enter amount"
                  aria-label="Contribute amount"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={handleContribute} className="w-full mt-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-md">Contribute</button>
                <p className="text-[11px] text-slate-400 mt-3">Contributions create a debit transaction and decrease balance.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <label className="text-xs text-slate-500 block mb-2">Withdraw from savings (₹)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  aria-label="Withdraw amount"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button onClick={handleWithdraw} className="w-full mt-3 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-md">Withdraw</button>
                <p className="text-[11px] text-slate-400 mt-3">Withdrawals create a credit transaction and increase balance.</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-500">Share this goal with others or import a shared goal.</div>
              <div className="flex gap-2">
                <button onClick={handleMakePublic} className="text-xs px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-600">Make Public</button>
                {sharedGoalAvailable && (
                  <button onClick={handleImportPublic} className="text-xs px-3 py-1 rounded-lg border border-indigo-500/20">Import Shared Goal</button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-600 dark:text-indigo-400">
                <i className="fas fa-robot"></i>
              </div>
              <h5 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Balthazar's Skip Strategy</h5>
            </div>

            {loading ? (
              <div className="py-4 flex flex-col items-center justify-center gap-2 text-slate-400 italic text-xs">
                <i className="fas fa-circle-notch fa-spin"></i>
                Crunching the numbers...
              </div>
            ) : strategy ? (
              <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                  To hit this goal faster, skip just <span className="text-indigo-600 dark:text-indigo-400 font-bold">{strategy.skipsRequired}</span> more <span className="text-indigo-600 dark:text-indigo-400 font-bold">{strategy.itemToSkip}</span>.
                </p>
                <div className="flex items-center gap-3 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                  <div className="text-2xl text-indigo-500/50">
                    <i className="fas fa-mug-hot"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-0.5">Average Save</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">₹{strategy.avgCostPerItem.toFixed(0)} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/ skip</span></p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic mt-3 leading-tight">
                  "{strategy.encouragement}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">
                Need more transactions to suggest a "Skip-it" strategy.
              </p>
            )}
          </div>
        </div>
      ) : !isAdding && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-2xl mb-4">
            <i className="fas fa-piggy-bank"></i>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">No active goals</p>
          <p className="text-xs text-slate-400 dark:text-slate-600 max-w-[200px]">Set a goal and Balthazar will tell you exactly what to skip to get there.</p>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;
