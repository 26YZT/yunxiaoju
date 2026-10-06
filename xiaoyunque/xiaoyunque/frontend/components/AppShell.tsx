'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight, Clapperboard, Clock, FolderClosed, Hexagon, Home, Loader2, Plus, Repeat2, Settings, Trash2, UserRound } from 'lucide-react';
import clsx from 'clsx';
import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import BrandMark from '@/components/ui/BrandMark';
import EmptyState from '@/components/ui/EmptyState';
import { STAGES } from '@/config/workflow';
import { clearTempCache, fetchPipelineTasks, fetchSandboxTasks, fetchSessions, type PipelineTask, type SandboxTask } from '@/lib/workflowApi';

const NAV_ITEMS = [
  { href: '/', label: '创作台', icon: Home },
  { href: '/sandbox', label: '生成工具', icon: Hexagon },
  { href: '/pipelines/standard', label: '文艺短视频', icon: Clapperboard },
  { href: '/pipelines/action-transfer', label: '动作迁移', icon: Repeat2 },
  { href: '/pipelines/digital-human', label: '数字人口播', icon: UserRound },
];

const SETTINGS_ITEM = { href: '/settings', label: '设置', icon: Settings };

function openFreshWorkspace(event: MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  // The editor owns draft state; a new workspace must not inherit an active draft.
  window.location.assign(event.currentTarget.href);
}

const PIPELINE_ROUTES: Record<string, { href: string; label: string }> = {
  standard: { href: '/pipelines/standard', label: '文艺短视频' },
  action_transfer: { href: '/pipelines/action-transfer', label: '动作迁移' },
  digital_human: { href: '/pipelines/digital-human', label: '数字人口播' },
};

const TASK_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500',
  running: 'bg-blue-50 text-blue-600',
  waiting: 'bg-amber-50 text-amber-600',
  completed: 'bg-green-50 text-green-600',
  failed: 'bg-red-50 text-red-600',
};

function statusText(status?: string) {
  if (status === 'pending') return '等待中';
  if (status === 'running') return '生成中';
  if (status === 'waiting') return '待确认';
  if (status === 'completed') return '已完成';
  if (status === 'failed') return '失败';
  return status || '未知';
}

function taskTitle(task: PipelineTask) {
  const input = task.input || {};
  const output = task.output || {};
  return output.title || input.title || input.goods_title || input.text || input.prompt_text || input.goods_text || task.task_id;
}

type RunningTaskItem = {
  id: string;
  href: string;
  title: string;
  scope: string;
  status: string;
  progress: number;
};

const WORKFLOW_STAGE_COUNT = STAGES.length;
const COMPLETED_TASK_DISMISS_KEY = 'yunxiaoju.dismissed-completed-tasks';
const SIDEBAR_OPEN_KEY = 'yunxiaoju.sidebar-open';

function readPreference(key: string): string | null {
  // Read the previous product's keys only for preference compatibility.
  return window.localStorage.getItem(key) ?? window.localStorage.getItem(key.replace('yunxiaoju.', 'xiaoyunque.'));
}

interface SessionSummary { id: string; idea?: string; title?: string; status?: Record<string, string> }

function projectTaskFromSession(session: SessionSummary): RunningTaskItem | null {
  const statusMap = session.status || {};
  const values = STAGES.map(stage => statusMap[stage.id]);
  if (!values.includes('running')) return null;
  const completed = values.filter(value => ['completed', 'session_completed'].includes(String(value))).length;
  const runningStage = STAGES.map(stage => stage.id).find(key => statusMap[key] === 'running');
  return {
    id: `project-${session.id}`,
    href: `/?session=${encodeURIComponent(session.id)}`,
    title: session.idea || session.id,
    scope: runningStage ? `短片创作 · ${STAGES.find(stage => stage.id === runningStage)?.name || runningStage}` : '主流程',
    status: 'running',
    progress: Math.round((completed / WORKFLOW_STAGE_COUNT) * 100),
  };
}

function projectReviewTaskFromSession(session: SessionSummary): RunningTaskItem | null {
  const statusMap = session.status || {};
  const waitingStage = STAGES.map(stage => stage.id).find(key => statusMap[key] === 'waiting');
  const completed = STAGES.map(stage => statusMap[stage.id]).filter(value => ['completed', 'session_completed'].includes(String(value))).length;
  const allDone = completed >= WORKFLOW_STAGE_COUNT || statusMap.completed === 'completed';
  if (!waitingStage && !allDone) return null;
  const targetStage = waitingStage || Object.keys(statusMap).reverse().find(key => ['completed', 'session_completed'].includes(String(statusMap[key]))) || '';
  return {
    id: `project-review-${session.id}-${waitingStage || 'completed'}`,
    href: `/?session=${encodeURIComponent(session.id)}${targetStage ? `&stage=${encodeURIComponent(targetStage)}` : ''}`,
    title: session.idea || session.title || session.id,
    scope: waitingStage ? `短片创作 · ${STAGES.find(stage => stage.id === waitingStage)?.name || waitingStage}` : '主流程',
    status: waitingStage ? 'waiting' : 'completed',
    progress: waitingStage ? Math.round((completed / WORKFLOW_STAGE_COUNT) * 100) : 100,
  };
}

function pipelineTaskItem(task: PipelineTask): RunningTaskItem | null {
  const route = PIPELINE_ROUTES[task.pipeline];
  if (!route || !['pending', 'running'].includes(task.status)) return null;
  return {
    id: `pipeline-${task.task_id}`,
    href: `${route.href}?task=${encodeURIComponent(task.task_id)}`,
    title: String(taskTitle(task)),
    scope: route.label,
    status: task.status,
    progress: task.progress || 0,
  };
}

function pipelineCompletedTaskItem(task: PipelineTask): RunningTaskItem | null {
  const route = PIPELINE_ROUTES[task.pipeline];
  if (!route || task.status !== 'completed') return null;
  return {
    id: `pipeline-completed-${task.task_id}`,
    href: `${route.href}?task=${encodeURIComponent(task.task_id)}`,
    title: String(taskTitle(task)),
    scope: route.label,
    status: 'completed',
    progress: 100,
  };
}

const SANDBOX_TOOL_LABELS: Record<string, string> = {
  llm: 'LLM',
  vlm: 'VLM',
  t2i: '文生图',
  i2i: '图生图',
  video: '视频生成',
};

function sandboxTaskItem(task: SandboxTask): RunningTaskItem {
  const input = task.input || {};
  return {
    id: `sandbox-${task.id}`,
    href: `/sandbox?task=${encodeURIComponent(task.id)}`,
    title: input.prompt || input.reference_image || task.id,
    scope: `生成工具 · ${SANDBOX_TOOL_LABELS[task.tool] || task.tool}`,
    status: task.status || 'running',
    progress: task.progress || 1,
  };
}

function loadDismissedCompletedTasks(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = readPreference(COMPLETED_TASK_DISMISS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveDismissedCompletedTasks(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMPLETED_TASK_DISMISS_KEY, JSON.stringify(Array.from(ids)));
}

function loadSidebarOpen(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = readPreference(SIDEBAR_OPEN_KEY);
  return stored === null ? window.innerWidth >= 1104 : stored === 'true';
}

function saveSidebarOpen(open: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SIDEBAR_OPEN_KEY, open ? 'true' : 'false');
}

function TaskPanel({
  title,
  icon,
  loading,
  tasks,
  currentPath,
  emptyText,
  onTaskClick,
}: {
  title: string;
  icon: React.ReactNode;
  loading?: boolean;
  tasks: RunningTaskItem[];
  currentPath: string;
  emptyText: string;
  onTaskClick: (task: RunningTaskItem) => void;
}) {
  return (
    <section className="xyq-task-panel">
      <div className="ui-task-heading">
        {icon}
        <span>{title}</span><span className="ui-count">{tasks.length}</span>
        {loading && <Loader2 className="ml-auto h-3 w-3 animate-spin text-gray-300" />}
      </div>
      <div className="ui-task-list">
        {tasks.length ? (
          <div className="space-y-1.5">
            {tasks.map(task => {
              const active = currentPath === task.href.split('?')[0];
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onTaskClick(task)}
                  className={clsx(
                    'xyq-task-item',
                    active ? 'border-blue-100 bg-blue-50/60' : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700">
                      {task.title.slice(0, 36)}
                    </span>
                    <span className={clsx('flex-shrink-0 rounded px-1.5 py-0.5 text-[10px]', TASK_STATUS_STYLE[task.status] || TASK_STATUS_STYLE.pending)}>
                      {statusText(task.status)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="truncate text-[10px] text-gray-400">{task.scope}</span>
                    <div className="h-1 min-w-10 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${task.progress || 0}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState compact title={emptyText} />
        )}
      </div>
    </section>
  );
}

function SidebarTaskPanels({ currentPath }: { currentPath: string }) {
  const router = useRouter();
  const [runningTasks, setRunningTasks] = useState<RunningTaskItem[]>([]);
  const [completedTasks, setCompletedTasks] = useState<RunningTaskItem[]>([]);
  const [dismissedCompleted, setDismissedCompleted] = useState<Set<string>>(() => loadDismissedCompletedTasks());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pipelineRecords, sessions, sandboxRecords] = await Promise.all([
        fetchPipelineTasks(100).catch(() => []),
        fetchSessions().catch(() => []),
        fetchSandboxTasks().catch(() => []),
      ]);
      setRunningTasks([
        ...sandboxRecords.map(sandboxTaskItem),
        ...pipelineRecords.map(pipelineTaskItem).filter((task): task is RunningTaskItem => Boolean(task)),
        ...sessions.map(projectTaskFromSession).filter((task): task is RunningTaskItem => Boolean(task)),
      ]);
      setCompletedTasks([
        ...pipelineRecords.map(pipelineCompletedTaskItem).filter((task): task is RunningTaskItem => Boolean(task)),
        ...sessions.map(projectReviewTaskFromSession).filter((task): task is RunningTaskItem => Boolean(task)),
      ].filter(task => !dismissedCompleted.has(task.id)));
    } finally {
      setLoading(false);
    }
  }, [dismissedCompleted]);

  useEffect(() => {
    const initial = window.setTimeout(() => load().catch(() => {}), 0);
    const timer = window.setInterval(() => load().catch(() => {}), 3000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);

  const handleRunningClick = (task: RunningTaskItem) => {
    router.push(task.href);
  };

  const handleCompletedClick = (task: RunningTaskItem) => {
    const next = new Set(dismissedCompleted);
    next.add(task.id);
    saveDismissedCompletedTasks(next);
    setDismissedCompleted(next);
    setCompletedTasks(current => current.filter(item => item.id !== task.id));
    router.push(task.href);
  };

  return (
    <>
      <TaskPanel
        title="进行中任务"
        icon={<Clock className="h-3.5 w-3.5 text-gray-400" />}
        loading={loading}
        tasks={runningTasks}
        currentPath={currentPath}
        emptyText="暂无进行中的任务"
        onTaskClick={handleRunningClick}
      />
      <TaskPanel
        title="已完成/等待确认"
        icon={<CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />}
        tasks={completedTasks}
        currentPath={currentPath}
        emptyText="作品将在这里等待你"
        onTaskClick={handleCompletedClick}
      />
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setOpen(loadSidebarOpen()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setSidebarOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    saveSidebarOpen(nextOpen);
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const result = await clearTempCache();
      window.alert(`缓存已清空，删除 ${result.deleted} 项，释放 ${Number(result.freed_mb || 0).toFixed(2)} MB。`);
      setSettingsMenuOpen(false);
    } catch (error: unknown) {
      window.alert(error instanceof Error ? error.message : '清空缓存失败');
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="xyq-shell" data-sidebar-open={open} style={{ '--app-sidebar-width': open ? '228px' : '0px' } as CSSProperties}>
      {open && <button className="ui-sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="关闭导航菜单" />}
      <aside className="xyq-sidebar" style={{ width: open ? '228px' : '0px' }} aria-label="主导航" inert={!open}>
        <div className={clsx('ui-sidebar-content', !open && 'invisible')}>
          <div className="xyq-sidebar-brand">
            <Link href="/" onClick={openFreshWorkspace} aria-label="云小剧创作台"><BrandMark /></Link>
            <button className="ui-icon-button ui-sidebar-collapse" onClick={() => setSidebarOpen(false)} aria-label="收起侧边栏"><ChevronLeft size={17} /></button>
          </div>
          <Link className="ui-new-project" href="/" onClick={openFreshWorkspace}><Plus size={18} />开始创作</Link>
          <nav className="xyq-sidebar-nav" aria-label="创作工具">
            <div className="ui-nav-caption">创作空间</div>
            {NAV_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <div key={item.href}>
                  {index === 2 && <div className="ui-nav-caption ui-nav-divider">快速创作</div>}
                  <Link href={item.href} aria-current={active ? 'page' : undefined}
                    onClick={() => { if (window.innerWidth < 900) setSidebarOpen(false); }}
                    className={clsx('xyq-sidebar-link', active && 'is-active')}>
                    <Icon size={18} strokeWidth={1.7} /><span>{item.label}</span>
                    {active && <span className="ui-nav-active-dot" aria-hidden="true" />}
                  </Link>
                  {index === 0 && <Link href="/#projects" onClick={openFreshWorkspace} className="xyq-sidebar-link"><FolderClosed size={18} strokeWidth={1.7} /><span>我的项目</span></Link>}
                </div>
              );
            })}
          </nav>
          <div className="ui-sidebar-tasks"><SidebarTaskPanels currentPath={pathname} /></div>
          <div className="xyq-sidebar-footer">
            {settingsMenuOpen && (
              <div className="xyq-settings-menu">
                <button type="button" onClick={() => { setSettingsMenuOpen(false); router.push(SETTINGS_ITEM.href); if (window.innerWidth < 900) setSidebarOpen(false); }}><Settings size={16} />模型与应用设置</button>
                <button type="button" onClick={handleClearCache} disabled={clearingCache}>
                  {clearingCache ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}清空临时缓存
                </button>
              </div>
            )}
            <button className={clsx('ui-settings-button', (pathname === '/settings' || settingsMenuOpen) && 'is-active')}
              type="button" onClick={() => setSettingsMenuOpen(value => !value)} aria-expanded={settingsMenuOpen}>
              <Settings size={18} strokeWidth={1.7} /><span>设置与配置</span><ChevronRight size={14} />
            </button>
            <div className="ui-sidebar-meta"><span>云小剧</span><span>让灵感成剧</span></div>
          </div>
        </div>
      </aside>
      {!open && <button className="ui-sidebar-open ui-icon-button" onClick={() => setSidebarOpen(true)} aria-label="打开侧边栏"><ChevronRight size={18} /></button>}
      <main className="xyq-main" style={{ marginLeft: 'var(--app-sidebar-width)' }}>{children}</main>
    </div>
  );
}
