export const STAGES = [
  { id: 'script_generation', name: '剧本生成', shortName: '剧本' },
  { id: 'character_design', name: '角色设计', shortName: '角色' },
  { id: 'storyboard', name: '分镜设计', shortName: '分镜' },
  { id: 'reference_generation', name: '参考图', shortName: '参考图' },
  { id: 'video_generation', name: '视频生成', shortName: '视频' },
  { id: 'post_production', name: '后期剪辑', shortName: '后期' },
] as const;

export type StageId = typeof STAGES[number]['id'];
