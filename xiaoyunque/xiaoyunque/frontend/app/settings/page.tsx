'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, Save, Settings, XCircle } from 'lucide-react';
import BrandHeader from '@/components/BrandHeader';
import PageHeading from '@/components/ui/PageHeading';
import ProviderSelect from '@/components/ui/ProviderSelect';
import { fetchModelGroupsByType, fetchVideoModelGroupsByAbility } from '@/lib/modelRegistry';
import {
  VIDEO_RATIOS,
  VIDEO_RESOLUTIONS,
  VIDEO_GENERATION_MODES,
  STYLES,
  type ProviderGroup,
} from '@/config/models';

type ConfigTree = Record<string, any>;

type Field = {
  path: string;
  label: string;
  type?: 'text' | 'number' | 'boolean' | 'password' | 'select';
  options?: Array<{ id: string; label: string }> | ProviderGroup[];
};

type ModelSelectKey = 'llm' | 'vlm' | 'image_it2i' | 'image_t2i' | 'video_first_frame' | 'video_start_end' | 'video_reference';

const EMPTY_MODEL_SELECTS: Record<ModelSelectKey, ProviderGroup[]> = {
  llm: [],
  vlm: [],
  image_it2i: [],
  image_t2i: [],
  video_first_frame: [],
  video_start_end: [],
  video_reference: [],
};

const LOG_LEVEL_OPTIONS = [
  { id: 'DEBUG', label: 'DEBUG - 最详细' },
  { id: 'INFO', label: 'INFO - 常规' },
  { id: 'WARNING', label: 'WARNING - 仅警告及错误' },
  { id: 'ERROR', label: 'ERROR - 仅错误' },
  { id: 'CRITICAL', label: 'CRITICAL - 严重错误' },
];

const GROUPS: Array<{ title: string; description: string; fields: Field[] }> = [
  {
    title: '应用服务',
    description: '服务启动与日志配置。host / port 保存后需要重启后端完全生效。',
    fields: [
      { path: 'server.host', label: 'host 主机地址' },
      { path: 'server.port', label: 'port 端口', type: 'number' },
      { path: 'server.log_level', label: 'log_level 日志层级', type: 'select', options: LOG_LEVEL_OPTIONS },
      { path: 'server.access_log', label: 'access_log 请求访问日志', type: 'boolean' },
    ],
  },
  {
    title: '网络与调试',
    description: '模型调用公共配置和代理设置。',
    fields: [
      { path: 'api_providers.common.print_model_input', label: 'print_model_input 打印模型输入', type: 'boolean' },
      { path: 'api_providers.common.proxy', label: 'proxy 代理地址' },
    ],
  },
  {
    title: 'OpenAI',
    description: 'OpenAI / 兼容 OpenAI 接口配置。',
    fields: [
      { path: 'api_providers.openai.api_key', label: 'api_key API 密钥', type: 'password' },
      { path: 'api_providers.openai.base_url', label: 'base_url 接口地址' },
      { path: 'api_providers.openai.enable_proxy', label: 'enable_proxy 启用代理', type: 'boolean' },
    ],
  },
  {
    title: 'Gemini',
    description: 'Gemini 及兼容接口配置。',
    fields: [
      { path: 'api_providers.gemini.api_key', label: 'api_key API 密钥', type: 'password' },
      { path: 'api_providers.gemini.base_url', label: 'base_url 接口地址' },
      { path: 'api_providers.gemini.enable_proxy', label: 'enable_proxy 启用代理', type: 'boolean' },
    ],
  },
  {
    title: 'DeepSeek',
    description: 'DeepSeek 接口配置。',
    fields: [
      { path: 'api_providers.deepseek.api_key', label: 'api_key API 密钥', type: 'password' },
      { path: 'api_providers.deepseek.base_url', label: 'base_url 接口地址' },
      { path: 'api_providers.deepseek.enable_proxy', label: 'enable_proxy 启用代理', type: 'boolean' },
    ],
  },
  {
    title: 'DashScope',
    description: '通义千问、通义万相等 DashScope 服务配置。',
    fields: [
      { path: 'api_providers.dashscope.api_key', label: 'api_key API 密钥', type: 'password' },
      { path: 'api_providers.dashscope.base_url', label: 'base_url 接口地址' },
      { path: 'api_providers.dashscope.enable_proxy', label: 'enable_proxy 启用代理', type: 'boolean' },
    ],
  },
  {
    title: 'ARK',
    description: 'Seedream / Seedance 使用的火山方舟配置。',
    fields: [
      { path: 'api_providers.ark.api_key', label: 'api_key API 密钥', type: 'password' },
      { path: 'api_providers.ark.base_url', label: 'base_url 接口地址' },
      { path: 'api_providers.ark.enable_proxy', label: 'enable_proxy 启用代理', type: 'boolean' },
    ],
  },
  {
    title: 'Kling',
    description: '可灵视频生成接口配置。',
    fields: [
      { path: 'api_providers.kling.base_url', label: 'base_url 接口地址' },
      { path: 'api_providers.kling.access_key', label: 'access_key 访问密钥', type: 'password' },
      { path: 'api_providers.kling.secret_key', label: 'secret_key 私密密钥', type: 'password' },
      { path: 'api_providers.kling.enable_proxy', label: 'enable_proxy 启用代理', type: 'boolean' },
    ],
  },
  {
    title: '默认模型',
    description: '设置故事创作各阶段使用的默认模型。',
    fields: [
      { path: 'models.llm', label: 'llm 文本模型', type: 'select', options: [] },
      { path: 'models.vlm', label: 'vlm 视觉语言模型', type: 'select', options: [] },
      { path: 'models.image_it2i', label: 'image_it2i 图生图模型', type: 'select', options: [] },
      { path: 'models.image_t2i', label: 'image_t2i 文生图模型', type: 'select', options: [] },
      { path: 'models.video_first_frame', label: 'video_first_frame 首帧生视频模型', type: 'select', options: [] },
      { path: 'models.video_start_end', label: 'video_start_end 首尾帧生视频模型', type: 'select', options: [] },
      { path: 'models.video_reference', label: 'video_reference 参考图生视频模型', type: 'select', options: [] },
    ],
  },
  {
    title: '视频生成配置',
    description: '只对主流程生效：选择视频生成方式、风格、画幅比例和视频分辨率。',
    fields: [
      { path: 'generation.video_generation_mode', label: 'video_generation_mode 视频生成方式', type: 'select', options: VIDEO_GENERATION_MODES },
      { path: 'generation.style', label: 'style 风格', type: 'select', options: STYLES },
      { path: 'generation.video_ratio', label: 'video_ratio 视频长宽比', type: 'select', options: VIDEO_RATIOS },
      { path: 'generation.video_resolution', label: 'video_resolution 视频分辨率', type: 'select', options: VIDEO_RESOLUTIONS },
    ],
  },
];

function getValue(config: ConfigTree, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], config);
}

function setValue(config: ConfigTree, path: string, value: any): ConfigTree {
  const next = structuredClone(config || {});
  const parts = path.split('.');
  let current = next;
  for (const part of parts.slice(0, -1)) {
    current[part] = current[part] || {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return next;
}

function formatConfigPath(path: string) {
  if (!path) return 'backend/config.yaml';
  const normalized = path.replace(/\\/g, '/');
  const marker = '/xiaoyunque/xiaoyunque/';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) return normalized.slice(markerIndex + marker.length);
  const backendIndex = normalized.lastIndexOf('/backend/config.yaml');
  if (backendIndex >= 0) return normalized.slice(backendIndex + 1);
  return normalized;
}

function maskSecret(value: unknown) {
  const text = String(value ?? '');
  if (!text) return '';
  if (text.length <= 10) return '*'.repeat(text.length);
  return `${text.slice(0, 5)}${'*'.repeat(Math.min(12, text.length - 10))}${text.slice(-5)}`;
}

function isProviderOptions(options: Field['options']): options is ProviderGroup[] {
  return Array.isArray(options) && options.some(option => 'models' in option);
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('模型服务');
  const [config, setConfig] = useState<ConfigTree>({});
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({});
  const [modelSelects, setModelSelects] = useState<Record<ModelSelectKey, ProviderGroup[]>>(EMPTY_MODEL_SELECTS);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await fetch('/api/config');
        if (!resp.ok) throw new Error('读取配置失败');
        const data = await resp.json();
        setConfig(data.config || {});
        setPath(data.path || '');
        setSecretDrafts({});
      } catch (e: any) {
        setError(e.message || '读取配置失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchModelGroupsByType('llm'),
      fetchModelGroupsByType('vlm'),
      fetchModelGroupsByType('i2i'),
      fetchModelGroupsByType('t2i'),
      fetchVideoModelGroupsByAbility('first_frame_i2v'),
      fetchVideoModelGroupsByAbility('start_end_frame_i2v'),
      fetchVideoModelGroupsByAbility('reference_to_video'),
    ])
      .then(([llm, vlm, imageIt2i, imageT2i, firstFrameVideo, startEndVideo, referenceVideo]) => {
        if (cancelled) return;
        setModelSelects({
          llm,
          vlm,
          image_it2i: imageIt2i,
          image_t2i: imageT2i,
          video_first_frame: firstFrameVideo,
          video_start_end: startEndVideo,
          video_reference: referenceVideo,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const groups = GROUPS.map(group => {
    if (group.title !== '默认模型') return group;
    return {
      ...group,
      fields: group.fields.map(field => {
        if (field.path === 'models.llm') return { ...field, options: modelSelects.llm };
        if (field.path === 'models.vlm') return { ...field, options: modelSelects.vlm };
        if (field.path === 'models.image_it2i') return { ...field, options: modelSelects.image_it2i };
        if (field.path === 'models.image_t2i') return { ...field, options: modelSelects.image_t2i };
        if (field.path === 'models.video_first_frame') return { ...field, options: modelSelects.video_first_frame };
        if (field.path === 'models.video_start_end') return { ...field, options: modelSelects.video_start_end };
        if (field.path === 'models.video_reference') return { ...field, options: modelSelects.video_reference };
        return field;
      }),
    };
  });

  const updateField = (field: Field, raw: string | boolean) => {
    const value = field.type === 'number' ? Number(raw) || 0 : raw;
    setConfig(current => setValue(current, field.path, value));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const resp = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: config }),
      });
      if (!resp.ok) throw new Error('保存配置失败');
      const data = await resp.json();
      setConfig(data.config || {});
      setPath(data.path || '');
      setSecretDrafts({});
      setMessage('配置已保存');
    } catch (e: any) {
      setError(e.message || '保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const updateSecretField = (field: Field, raw: string) => {
    setSecretDrafts(current => ({ ...current, [field.path]: raw }));
    setConfig(current => setValue(current, field.path, raw));
  };

  return (
    <div className="ui-page ui-settings-page min-h-screen">
      <BrandHeader />
      <main className="ui-page-container">
        <PageHeading title="设置" icon={<Settings />} eyebrow="工作空间 / 偏好与连接" description="管理模型服务、默认创作参数和应用偏好。修改后点击保存配置。" />
        <div className="ui-settings-tabs" role="group" aria-label="设置分类">{['模型服务', '创作默认值', '高级设置'].map(section => <button key={section} onClick={() => setActiveSection(section)} aria-pressed={activeSection === section}>{section}</button>)}</div>
        {activeSection === '高级设置' && <details className="mb-5 text-xs text-gray-500"><summary className="cursor-pointer">配置文件位置</summary><code className="mt-2 block break-all">{formatConfigPath(path)}</code></details>}

        {loading ? (
          <div className="h-56 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-sm text-gray-400">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            正在读取配置
          </div>
        ) : (
          <div className="space-y-5">
            {groups.filter(group => activeSection === '创作默认值' ? ['默认模型', '视频生成配置'].includes(group.title) : activeSection === '高级设置' ? ['应用服务', '网络与调试'].includes(group.title) : !['默认模型', '视频生成配置', '应用服务', '网络与调试'].includes(group.title)).map(group => (
              <section key={group.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-800">{group.title}</h2>
                  <p className="mt-1 text-xs text-gray-500">{group.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.fields.map(field => {
                    const value = getValue(config, field.path);
                    return (
                      <label key={field.path} className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-gray-500">{field.label.replace(/^[a-z_]+ /, '')}</span>
                        {field.type === 'boolean' ? (
                          <select
                            value={String(Boolean(value))}
                            onChange={event => updateField(field, event.target.value === 'true')}
                            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-300"
                          >
                            <option value="true">开启</option>
                            <option value="false">关闭</option>
                          </select>
                        ) : field.type === 'select' ? (
                          (isProviderOptions(field.options) || field.path.startsWith('models.')) ? <ProviderSelect value={String(value ?? '')} providers={isProviderOptions(field.options) ? field.options : []} onChange={value => updateField(field, value)} /> : (
                            <select value={String(value ?? '')} onChange={event => updateField(field, event.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-300">
                              {(field.options || []).map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                            </select>
                          )
                        ) : field.type === 'password' ? (
                          <input
                            type="password"
                            value={secretDrafts[field.path] ?? maskSecret(value)}
                            onFocus={event => event.currentTarget.select()}
                            onChange={event => updateSecretField(field, event.target.value)}
                            placeholder="输入新密钥覆盖"
                            className="h-10 rounded-lg border border-gray-200 bg-white px-3 font-mono text-sm text-gray-700 outline-none focus:border-blue-300"
                          />
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={String(value ?? '')}
                            onChange={event => updateField(field, event.target.value)}
                            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-300"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
              {message && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {message}
                </span>
              )}
              {error && (
                <span className="flex items-center gap-1.5 text-sm text-red-600">
                  <XCircle className="w-4 h-4" />
                  {error}
                </span>
              )}
              <button
                onClick={save}
                disabled={saving}
                className="ml-auto flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-200"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存配置
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
