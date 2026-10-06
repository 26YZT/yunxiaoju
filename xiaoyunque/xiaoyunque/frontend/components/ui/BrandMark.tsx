import clsx from 'clsx';
import CloudMark from './CloudMark';
import { PRODUCT_NAME } from '@/config/brand';

export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={clsx('ui-brand', compact && 'ui-brand-compact')}>
      <span className="ui-brand-symbol"><CloudMark /></span>
      {!compact && <span className="ui-brand-copy"><strong>{PRODUCT_NAME}</strong><small>AI 短剧创作工作室</small></span>}
    </span>
  );
}
