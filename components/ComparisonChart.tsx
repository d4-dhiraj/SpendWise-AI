
import React, { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Transaction, ComparisonData } from '../types';
import { getPeerComparison } from '../services/geminiService';

Chart.register(...registerables);

interface ComparisonChartProps {
  transactions: Transaction[];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ transactions }) => {
  const [comparison, setComparison] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (transactions.length < 5) return;
      setLoading(true);
      try {
        const data = await getPeerComparison(transactions);
        setComparison(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [transactions.length]);

  useEffect(() => {
    if (!chartRef.current || comparison.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const isDarkMode = document.documentElement.classList.contains('dark');
    const labelColor = isDarkMode ? '#94a3b8' : '#64748b';
    const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: comparison.map(c => c.category),
        datasets: [
          {
            label: 'You',
            data: comparison.map(c => c.userAmount),
            backgroundColor: '#6366f1',
            borderRadius: 6,
          },
          {
            label: 'Avg Peer',
            data: comparison.map(c => c.peerAmount),
            backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
            borderRadius: 6,
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: labelColor, font: { size: 10, weight: 'bold' } }
          }
        },
        scales: {
          x: { 
            grid: { color: gridColor }, 
            ticks: { color: labelColor, font: { size: 9 } } 
          },
          y: { 
            grid: { display: false }, 
            ticks: { color: labelColor, font: { size: 9, weight: 'bold' } } 
          }
        }
      }
    });

    return () => chartInstance.current?.destroy();
  }, [comparison, transactions.length]);

  const mainInsight = comparison.find(c => c.userAmount > c.peerAmount * 1.2)?.insight || comparison[0]?.insight;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-widest mb-1">Peer Benchmark</h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Global Avg</p>
        </div>
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
           <i className="fas fa-users-viewfinder"></i>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] relative">
        {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic text-xs">
                Scanning averages...
            </div>
        ) : comparison.length > 0 ? (
            <canvas ref={chartRef} />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs italic text-center px-4">
                Record 5+ transactions to unlock benchmark analysis.
            </div>
        )}
      </div>

      {mainInsight && !loading && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-xl flex gap-3 items-center">
            <i className="fas fa-quote-left text-indigo-400 dark:text-indigo-500/30 text-xs"></i>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-tight">
                "{mainInsight}"
            </p>
          </div>
      )}
    </div>
  );
};

export default ComparisonChart;
