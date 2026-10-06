'use client';

import type { SelectHTMLAttributes } from 'react';
import type { ProviderGroup } from '@/config/models';

interface ProviderSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string;
  providers: ProviderGroup[];
  onChange: (value: string) => void;
}

export default function ProviderSelect({ value, providers, onChange, className = '', ...props }: ProviderSelectProps) {
  const listed = providers.some(group => group.models.some(model => model.id === value));
  return (
    <select {...props} value={value} onChange={event => onChange(event.target.value)} className={`ui-select ${className}`}>
      {value && !listed && <option value={value}>{value} · 当前配置</option>}
      {!value && <option value="" disabled>{providers.length ? '请选择模型' : '正在加载模型…'}</option>}
      {providers.map(group => (
        <optgroup key={group.provider} label={group.label}>
          {group.models.map(model => <option key={model.id} value={model.id}>{model.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
