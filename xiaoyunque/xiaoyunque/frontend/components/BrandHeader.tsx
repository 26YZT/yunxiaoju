'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';

const PAGE_NAMES: Record<string, string> = {
  '/': '创作台',
  '/sandbox': '生成工具',
  '/pipelines/standard': '文艺短视频',
  '/pipelines/action-transfer': '动作迁移',
  '/pipelines/digital-human': '数字人口播',
  '/settings': '设置',
};

export default function BrandHeader() {
  const pathname = usePathname();
  return (
    <>
      <header className="ui-workspace-header">
        <div className="ui-breadcrumb"><Link href="/">云小剧</Link><ChevronRight size={14} /><span>{PAGE_NAMES[pathname] || '创作台'}</span></div>
        <Link className="ui-workspace-label" href="/settings"><SlidersHorizontal size={14} />模型设置</Link>
      </header>
      <div className="ui-header-spacer" />
    </>
  );
}
