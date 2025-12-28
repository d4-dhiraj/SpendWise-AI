
import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';

interface MapWidgetProps {
  transactions: Transaction[];
  isDark: boolean;
}

const MapWidget: React.FC<MapWidgetProps> = ({ transactions, isDark }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !(window as any).L || transactions.length === 0) return;

    const mapContainer = document.getElementById('expense-map');
    if (!mapContainer) return;

    const L = (window as any).L;
    
    // Default center
    const center = transactions.find(t => t.location)?.location || { lat: 20.5937, lng: 78.9629 };
    
    // Clear previous instance if exists via leaflet's internal tracking
    const existingMap = (window as any)._leafletMap;
    if (existingMap) {
        existingMap.remove();
    }

    const map = L.map('expense-map', {
        zoomControl: false,
        attributionControl: false
    }).setView([center.lat, center.lng], 13);
    
    (window as any)._leafletMap = map;

    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);

    transactions.forEach(tx => {
      if (tx.location && tx.type === 'debit') {
        const radius = Math.sqrt(tx.amount) * 3;
        L.circle([tx.location.lat, tx.location.lng], {
          color: tx.amount > 500 ? '#f43f5e' : '#6366f1',
          fillColor: tx.amount > 500 ? '#f43f5e' : '#6366f1',
          fillOpacity: 0.4,
          radius: radius > 50 ? radius : 50
        }).addTo(map)
        .bindPopup(`<strong>${tx.merchant}</strong><br/>₹${tx.amount}`);
      }
    });

    return () => {
      if ((window as any)._leafletMap) {
        (window as any)._leafletMap.remove();
        (window as any)._leafletMap = null;
      }
    };
  }, [mapLoaded, transactions, isDark]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-full flex flex-col min-h-[400px] shadow-xl transition-all">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-map-location-dot text-indigo-500"></i>
            Spending Hotspots
        </h4>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Heat-Scale</span>
      </div>
      <div id="expense-map" className="flex-1 w-full bg-slate-100 dark:bg-slate-950">
        {!mapLoaded && (
            <div className="h-full w-full flex items-center justify-center text-slate-400 italic text-xs">
                Connecting to satellites...
            </div>
        )}
      </div>
    </div>
  );
};

export default MapWidget;
