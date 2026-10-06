'use client';

import { Loader } from 'lucide-react';

interface StageProgressProps {
  message: string;
  fallback?: string;
  progress: number;
  color?: 'blue' | 'amber' | 'emerald' | 'violet' | 'rose' | 'cyan';
}

export default function StageProgress({ message, fallback = '处理中...', progress, color = 'blue' }: StageProgressProps) {
  const percent = Number.isFinite(progress) ? Math.min(100, Math.max(0, Math.round(progress))) : 0;
  const description = message?.includes(': ') ? message.split(': ').slice(1).join(': ') : (message || fallback);
  return (
    <div className="ui-stage-progress" data-stage-tone={color}>
      <div className="ui-progress-copy"><span><Loader size={15} className="animate-spin" /><span className="truncate">{description}</span></span><span>{percent}%</span></div>
      <div className="ui-progress-track" role="progressbar" aria-label={description} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div style={{ width: `${percent}%` }} /></div>
    </div>
  );
}
