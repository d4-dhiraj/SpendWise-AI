
import React, { useEffect, useRef } from 'react';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { Transaction, Category } from '../types';

Chart.register(...registerables);

interface ExpenseChartProps {
  transactions: Transaction[];
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ transactions }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    const labelColor = isDarkMode ? '#94a3b8' : '#64748b';
    const borderColor = isDarkMode ? '#0f172a' : '#ffffff';

    const categories = Object.values(Category);
    const data = categories.map(cat => 
      transactions
        .filter(t => t.category === cat && t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          label: 'Spending',
          data: data,
          backgroundColor: [
            '#f59e0b', // Food
            '#3b82f6', // Travel
            '#ec4899', // Fun
            '#8b5cf6', // Academic
            '#94a3b8', // Other
          ],
          borderColor: borderColor,
          borderWidth: 2,
          hoverOffset: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: labelColor,
              font: { family: 'Inter', size: 10, weight: 'bold' },
              padding: 20,
              usePointStyle: true,
            }
          }
        },
        cutout: '75%',
      } as any,
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    chartInstance.current = new Chart(chartRef.current, config);

    return () => chartInstance.current?.destroy();
  }, [transactions]);

  return (
    <div className="h-full min-h-[300px] w-full flex flex-col">
      <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-800 dark:text-slate-200">Spending Breakdown</h4>
      <div className="relative flex-1">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default ExpenseChart;
