import React from 'react';

interface Props {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  requestLocation?: () => void;
}

const Settings: React.FC<Props> = ({ theme, toggleTheme, requestLocation }) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Theme</p>
            <p className="text-xs text-slate-500">Toggle dark / light mode</p>
          </div>
          <button onClick={toggleTheme} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Location</p>
            <p className="text-xs text-slate-500">Enable geolocation to tag transactions</p>
          </div>
          <button onClick={requestLocation} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Request Location</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
