# 文艺短视频

文艺短视频对应 `standard` pipeline。它支持两种生成方式：

1. `image_concat`：为每句旁白生成一张图和一段 TTS 音频，用图片+音频合成静态图文片段，再拼接成最终视频。
2. `dynamic_video`：先为每句旁白生成图片，再调用图生视频模型生成动态片段，最后使用生成的 TTS 音频替换片段音轨并拼接成最终视频。

输入也支持两种方式：

1. `inspiration`：用户给创作灵感，并提供目标片段数量，后端用 LLM 扩写成对应数量的旁白句子。
2. `copy`：用户给完整文案，后端直接按句号切分，得到实际片段数量。

## 请求

```bash
curl -X POST "http://localhost:8000/api/pipelines/standard/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "video_mode": "image_concat",
    "mode": "inspiration",
    "text": "一个关于拖延症和自救的短视频灵感",
    "segment_count": 6,
    "title": "",
    "llm_model": "qwen3.5-plus",
    "image_model": "doubao-seedream-5-0-260128",
    "video_ratio": "9:16",
    "tts_voice": "zh-CN-YunjianNeural",
    "tts_speed": 1.2,
    "style_control": "Minimalist black-and-white matchstick figure style illustration, clean lines, simple sketch style",
    "enable_subtitles": true
  }'
```

动态视频模式示例：

```json
{
  "video_mode": "dynamic_video",
  "mode": "copy",
  "text": "第一句旁白。第二句旁白。",
  "image_model": "doubao-seedream-5-0-260128",
  "video_model": "wan2.7-i2v",
  "video_duration": 5
}
```

## 参数说明

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `video_mode` | | `image_concat` | `image_concat` 为图片拼接；`dynamic_video` 为动态视频 |
| `mode` | | `copy` | `inspiration` 为创作灵感，先经 LLM 构思；`copy` 为完整文案，直接切分 |
| `text` | ✅ | | 创作灵感或完整文案 |
| `segment_count` | | `6` | 仅 `inspiration` 模式使用，用于约束 LLM 扩写出的旁白句子数量 |
| `title` | | | 可选，留空时由 LLM 根据最终旁白生成 |
| `llm_model` | | 后端默认 | 标题生成、创作灵感扩写和图片提示词生成使用的 LLM |
| `image_model` | | 后端默认 | 文生图模型，需支持 `text_to_image` |
| `video_model` | | 后端默认 | 仅 `dynamic_video` 模式使用，需支持图生视频 |
| `video_duration` | | `5` | 仅 `dynamic_video` 模式使用，单个动态片段目标时长 |
| `video_ratio` | | `9:16` | 视频比例，支持 `9:16` / `16:9` / `1:1` |
| `tts_voice` | | `zh-CN-YunjianNeural` | Edge TTS 声音 |
| `tts_speed` | | `1.2` | TTS 语速 |
| `style_control` | | 火柴人黑白简笔风 | 作为所有图像提示词的前缀 |
| `enable_subtitles` | | `false` | 是否把标题和字幕直接绘制到生成图片上 |

默认风格控制：

```text
Minimalist black-and-white matchstick figure style illustration, clean lines, simple sketch style
```

## 字幕与标题

文艺短视频不依赖 FFmpeg `libass` 烧字幕。开启 `enable_subtitles` 时：

1. 后端先用 Pillow 将标题和当前句字幕绘制到每张图片上
2. 生成 `captioned_image_XX.jpg`
3. 图片拼接模式用带字图片合成静态视频片段
4. 动态视频模式用带字图片作为图生视频首帧

因此标题/字幕功能只需要 Pillow，不需要 FFmpeg 的 `ass` filter。

## 产物

产物目录：

```text
xiaoyunque/backend/code/result/task/{task_id}/
```

常见产物：

| 文件 | 说明 |
|------|------|
| `storyboard.json` | 每句旁白、图片提示词、图片/音频/视频路径 |
| `narration.txt` | 最终旁白文本 |
| `image_XX.*` | 每句旁白生成的原始图片 |
| `captioned_image_XX.jpg` | 开启字幕时生成的带标题/字幕图片 |
| `audio_XX.mp3` | 每句旁白生成的 TTS |
| `video_XX.mp4` | 图片拼接模式下，每句图片+音频合成的静态片段 |
| `video_XX_motion.mp4` | 动态视频模式下，每句生成的动态视频片段 |
| `final.mp4` | 最终拼接成片 |

## 响应

```json
{
  "task_id": "20260429_170348_a281f881",
  "pipeline": "standard",
  "status": "pending",
  "metadata_url": "/api/tasks/20260429_170348_a281f881",
  "output_dir": "/.../backend/code/result/task/20260429_170348_a281f881"
}
```

任务完成后查询：

```bash
curl "http://localhost:8000/api/tasks/{task_id}"
```

`output.final_video` 指向最终视频。

## 模型能力筛选

```bash
curl "http://localhost:8000/api/models?media_type=image&ability=text_to_image&verified_only=true"
curl "http://localhost:8000/api/models?media_type=video&ability=image_to_video&verified_only=true"
```

## 前端入口

```text
http://localhost:3000/pipelines/standard
```

前端选项：

| 控件 | 说明 |
|------|------|
| 图片拼接 / 动态视频 | 决定最终片段是由图片直接合成，还是继续调用图生视频模型 |
| 说明 | 根据当前模式提示生成方式和等待时间；图片约 10-20 秒/张，视频约 1-2 分钟/片段 |
| 创作灵感 / 完整文案 | 决定输入是否先经 LLM 构思 |
| 片段数量 | 仅创作灵感模式显示，用于约束 LLM 扩写句子数量 |
| 标题 | 可选，留空时由 LLM 生成 |
| 添加标题和字幕 | 直接画到生成图片上 |
| 生成配置 | LLM 模型、图片模型、动态视频模型、视频比例、TTS 声音、TTS 速度、风格控制 |

## 注意事项

1. 图片拼接模式不会调用视频生成模型；动态视频模式会调用图生视频模型。
2. 完整文案会按所有句号切分，建议每句不要太长。
3. 图像提示词会自动追加“不要生成文字、logo、水印、标签”等约束。
4. 如果开启标题和字幕，会额外生成带字图片产物。
