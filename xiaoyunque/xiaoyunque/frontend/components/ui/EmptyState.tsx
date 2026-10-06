import type { ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({ title, description, compact = false, icon }: {
  title: string; description?: string; compact?: boolean; icon?: ReactNode;
}) {
  return (
    <div className={`ui-empty-state${compact ? ' ui-empty-state-compact' : ''}`}>
      <span className="ui-empty-icon" aria-hidden="true">{icon || <FolderOpen size={20} strokeWidth={1.5} />}</span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
