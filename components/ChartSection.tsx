
import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { LogEntry, CollectionConfig } from '../types';

interface ChartSectionProps {
  data: LogEntry[];
  config: CollectionConfig;
}

const ChartSection: React.FC<ChartSectionProps> = ({ data, config }) => {
  const formattedData = data.slice(-40).map((entry, index) => {
    const d = new Date(entry.timestamp);
    return {
      ...entry,
      time: isNaN(d.getTime()) ? `T-${40 - index}` : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  const metrics = [
    { key: 'D', title: 'Demand Pulse (D) [SSDF]', color: '#f43f5e' },
    { key: 'total_metrics', title: 'Metrics (Ct)', color: '#22d3ee' },
    { key: 'CS', title: 'Capture Score (CS)', color: '#10b981' },
    { key: 'AS', title: 'Attention Score (AS)', color: '#fbbf24' },
    { key: 'SSM', title: 'Sentiment (SSM)', color: '#818cf8' },
    { key: 'S', title: 'Stickiness (S)', color: '#a855f7' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {metrics.map((metric) => (
        <div key={metric.key} className="glass p-8 rounded-[2.5rem] border-slate-800/50 flex flex-col space-y-6 hover:border-cyan-500/20 transition-all duration-700 shadow-lg group">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">{metric.title}</h3>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: metric.color, boxShadow: `0 0 10px ${metric.color}` }} />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metric.color} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={metric.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" fontSize={9} stroke="#475569" tickLine={false} axisLine={false} font-family="JetBrains Mono" />
                <YAxis fontSize={9} stroke="#475569" tickLine={false} axisLine={false} font-family="JetBrains Mono" />
                <Tooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '11px', backdropFilter: 'blur(8px)', fontStyle: 'normal' }} 
                  itemStyle={{ color: metric.color, fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={metric.key} 
                  stroke={metric.color} 
                  fillOpacity={1} 
                  fill={`url(#grad-${metric.key})`} 
                  strokeWidth={3}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChartSection;
