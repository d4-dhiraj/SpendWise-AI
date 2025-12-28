
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import SummaryCards from './components/SummaryCards';
import ExpenseTable from './components/ExpenseTable';
import ExpenseChart from './components/ExpenseChart';
import AIBuddy from './components/AIBuddy';
import FinancialRunway from './components/FinancialRunway';
import SavingsGoals from './components/SavingsGoals';
import MapWidget from './components/MapWidget';
import ComparisonChart from './components/ComparisonChart';
import LoginOverlay from './components/LoginOverlay';
import TransactionsView from './components/TransactionsView';
import Categories from './components/Categories';
import Settings from './components/Settings';
import { Transaction, Category, TransactionType } from './types';
import { classifySmsWithGemini, getSavingsTipFromGemini, classifyReceiptWithGemini } from './services/geminiService';
import { initializeFirebase, onAuthStateChanged } from './services/firebaseService';

const LOCAL_STORAGE_KEY = 'student_ai_expenses';
const BALANCE_STORAGE_KEY = 'student_ai_balance';
const THEME_KEY = 'student_ai_theme';

// Helper function to get user-specific storage keys
const getUserStorageKey = (userId: string | undefined) => {
  return userId ? `${LOCAL_STORAGE_KEY}_${userId}` : LOCAL_STORAGE_KEY;
};

const getUserBalanceKey = (userId: string | undefined) => {
  return userId ? `${BALANCE_STORAGE_KEY}_${userId}` : BALANCE_STORAGE_KEY;
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(1000); 
  const [smsInput, setSmsInput] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingsTip, setSavingsTip] = useState<string | null>(null);
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard'|'transactions'|'categories'|'settings'>('dashboard');

  useEffect(() => {
    // Initialize Firebase
    const initAuth = async () => {
      try {
        await initializeFirebase();
        
        // Set up auth state listener
        const unsubscribe = onAuthStateChanged((user: any) => {
          setCurrentUser(user);
          setIsAuthInitialized(true);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        setIsAuthInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Load theme on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location permission denied"),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => alert('Location permission denied'),
      { enableHighAccuracy: true }
    );
  };

  // Load user-specific data when user logs in
  useEffect(() => {
    if (currentUser && isAuthInitialized) {
      const userId = currentUser.uid;
      const txKey = getUserStorageKey(userId);
      const balKey = getUserBalanceKey(userId);

      const savedTxs = localStorage.getItem(txKey);
      const savedBal = localStorage.getItem(balKey);
      
      if (savedTxs) {
        setTransactions(JSON.parse(savedTxs));
      } else {
        setTransactions([]);
      }
      
      if (savedBal) {
        setBalance(parseFloat(savedBal));
      } else {
        setBalance(1000);
      }
    }
  }, [currentUser, isAuthInitialized]);

  // Save transactions to user-specific storage
  useEffect(() => {
    if (currentUser) {
      const txKey = getUserStorageKey(currentUser.uid);
      localStorage.setItem(txKey, JSON.stringify(transactions));
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const balKey = getUserBalanceKey(currentUser.uid);
      localStorage.setItem(balKey, balance.toString());
    }
  }, [balance, currentUser]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const generateTip = async () => {
    if (transactions.length === 0) return;
    setIsGeneratingTip(true);
    try {
      const tip = await getSavingsTipFromGemini(transactions);
      setSavingsTip(tip);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTip(false);
    }
  };

  const handleClassify = async () => {
    if (!smsInput.trim()) return;
    setIsClassifying(true);
    setError(null);

    try {
      const result = await classifySmsWithGemini(smsInput, userLocation);
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        amount: result.amount,
        merchant: result.merchant,
        category: result.category,
        type: result.type,
        location: result.location,
        date: new Date().toISOString(),
        rawSms: `SMS: ${smsInput.substring(0, 50)}...`
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      if (result.type === 'credit') setBalance(prev => prev + result.amount);
      else setBalance(prev => prev - result.amount);
      
      setSmsInput('');
      setSavingsTip(null);
    } catch (err: any) {
      setError(err.message || "Classification error.");
    } finally {
      setIsClassifying(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      try {
        const result = await classifyReceiptWithGemini(base64String, file.type);
        const newTransaction: Transaction = {
          id: crypto.randomUUID(),
          amount: result.amount,
          merchant: result.merchant,
          category: result.category,
          type: result.type,
          location: userLocation,
          date: new Date().toISOString(),
          rawSms: `Scanned: ${file.name}`
        };
        setTransactions(prev => [newTransaction, ...prev]);
        if (result.type === 'credit') setBalance(prev => prev + result.amount);
        else setBalance(prev => prev - result.amount);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      if (tx.type === 'credit') setBalance(prev => prev - tx.amount);
      else setBalance(prev => prev + tx.amount);
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Show loading state while auth is initializing
  if (!isAuthInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login overlay if user is not authenticated
  if (!currentUser) {
    return <LoginOverlay onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar user={currentUser} activeView={activeView} onNavigate={v => setActiveView(v as any)} />
      <div className="flex-1 flex flex-col lg:flex-row md:ml-64 transition-all duration-300">
        <main className="flex-1 p-4 md:p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Student Dashboard</h2>
              <p className="text-slate-500 dark:text-slate-400">Precision mapping & AI-driven financial conscience.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all border border-slate-300 dark:border-slate-700"
                title="Toggle Dark/Light Mode"
              >
                <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <button 
                onClick={generateTip}
                disabled={isGeneratingTip || transactions.length === 0}
                className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/20"
              >
                <i className={`fas fa-wand-magic-sparkles ${isGeneratingTip ? 'animate-pulse' : ''}`}></i>
                AI Savings Tip
              </button>
            </div>
          </header>

          {savingsTip && (
            <div className="mb-8 p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0"><i className="fas fa-lightbulb"></i></div>
              <div><p className="text-slate-800 dark:text-slate-200 leading-relaxed italic">"{savingsTip}"</p></div>
            </div>
          )}

          {activeView === 'dashboard' ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
                 <FinancialRunway transactions={transactions} balance={balance} onUpdateBalance={setBalance} />
                 <SummaryCards transactions={transactions} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
                 <div className="xl:col-span-2"><MapWidget transactions={transactions} isDark={theme === 'dark'} /></div>
                 <div className="xl:col-span-1"><ComparisonChart transactions={transactions} /></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><i className="fas fa-magic text-indigo-500"></i> Smart Classifier</h4>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                      <i className="fas fa-camera mr-2"></i>Scan Receipt
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <textarea
                    value={smsInput}
                    onChange={(e) => setSmsInput(e.target.value)}
                    placeholder="Paste bank SMS alert..."
                    className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder-slate-400"
                  />
                  <button onClick={handleClassify} disabled={isClassifying || !smsInput.trim()} className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20">
                    {isClassifying ? 'Analyzing Context...' : 'Process Message'}
                  </button>
                </div>
                <div className="h-full"><SavingsGoals transactions={transactions} currentUser={currentUser} onContribute={(amt, title) => {
                  // create a savings transaction when user contributes
                  const tx = {
                    id: crypto.randomUUID(),
                    amount: amt,
                    merchant: title ? `Savings: ${title}` : 'Savings Contribution',
                    category: Category.OTHER,
                    type: 'debit' as any,
                    location: userLocation,
                    date: new Date().toISOString(),
                    rawSms: 'Manual savings contribution'
                  } as Transaction;
                  setTransactions(prev => [tx, ...prev]);
                  setBalance(prev => prev - amt);
                }} onWithdraw={(amt, title) => {
                  // withdrawing increases balance and creates a credit transaction
                  const tx = {
                    id: crypto.randomUUID(),
                    amount: amt,
                    merchant: title ? `Withdraw: ${title}` : 'Savings Withdraw',
                    category: Category.OTHER,
                    type: 'credit' as any,
                    location: userLocation,
                    date: new Date().toISOString(),
                    rawSms: 'Manual savings withdraw'
                  } as Transaction;
                  setTransactions(prev => [tx, ...prev]);
                  setBalance(prev => prev + amt);
                }} /></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl"><ExpenseChart transactions={transactions} /></div>
                <div className="xl:col-span-2"><ExpenseTable transactions={transactions} onDelete={deleteTransaction} /></div>
              </div>
            </>
          ) : activeView === 'transactions' ? (
            <TransactionsView transactions={transactions} onDelete={deleteTransaction} />
          ) : activeView === 'categories' ? (
            <Categories />
          ) : (
            <Settings theme={theme} toggleTheme={toggleTheme} requestLocation={requestLocation} />
          )}
        </main>
        <aside className="lg:sticky lg:top-0 h-auto lg:h-screen transition-all">
          <AIBuddy transactions={transactions} onManualAdd={(data) => {
            const tx = {
              id: crypto.randomUUID(),
              amount: data.amount,
              merchant: data.merchant,
              category: data.category,
              type: data.type,
              location: userLocation,
              date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
              rawSms: 'Manual entry'
            } as Transaction;
            setTransactions(prev => [tx, ...prev]);
            if (tx.type === 'credit') setBalance(prev => prev + tx.amount);
            else setBalance(prev => prev - tx.amount);
          }} />
        </aside>
      </div>
    </div>
  );
};

export default App;
