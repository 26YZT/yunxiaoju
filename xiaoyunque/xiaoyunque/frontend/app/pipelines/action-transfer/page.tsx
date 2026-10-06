import { Suspense } from 'react';
import PipelinePage from '@/components/pipelines/PipelinePage';

export default function ActionTransferPipelinePage() {
  return (
    <Suspense fallback={null}>
      <PipelinePage
        pipeline="action_transfer"
        title="动作迁移"
        subtitle="用参考图片和动作视频生成角色动作迁移结果"
      />
    </Suspense>
  );
}
