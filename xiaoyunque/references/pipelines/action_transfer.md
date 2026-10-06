# 动作迁移

动作迁移对应 `action_transfer` pipeline。它接收一张角色/人物参考图片、一段动作视频和提示词，调用支持动作迁移能力的视频模型生成结果。

## 请求

```bash
curl -X POST "http://localhost:8000/api/pipelines/action_transfer/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_text": "让参考图片中的角色完成动作视频中的舞蹈动作，保持人物身份一致",
    "image_path": "/absolute/path/to/person.png",
    "video_path": "/absolute/path/to/action.mp4",
    "video_model": "wan2.7-videoedit",
    "video_ratio": "9:16",
    "duration": 5,
    "negative_prompt": ""
  }'
```

## 参数说明

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `prompt_text` | ✅ | | 动作迁移效果描述 |
| `image_path` | ✅ | | 参考图片路径，可使用上传接口返回的 `file_path` |
| `video_path` | ✅ | | 动作视频路径，可使用上传接口返回的 `file_path` |
| `video_model` | | `wan2.7-videoedit` | 需支持 `action_transfer` 能力 |
| `duration` | | `5` | 目标视频时长 |
| `video_ratio` | | `9:16` | 视频比例 |
| `resolution` | | | 可选分辨率 |
| `negative_prompt` | | | 负向提示词 |
| `watermark` | | | 是否保留模型水印 |
| `prompt_extend` | | | 是否启用模型提示词扩展 |

## 上传媒体

```bash
curl -X POST "http://localhost:8000/api/upload_media" \
  -F "file=@/path/to/person.png"

curl -X POST "http://localhost:8000/api/upload_media" \
  -F "file=@/path/to/action.mp4"
```

把响应中的 `file_path` 分别填入 `image_path` 和 `video_path`。

## 产物

产物目录：

```text
xiaoyunque/backend/code/result/task/{task_id}/
```

常见产物：

| 文件 | 说明 |
|------|------|
| `input_image.*` | 复制后的参考图片 |
| `input_video.*` | 复制后的动作视频 |
| `final.mp4` | 动作迁移生成视频 |
| `request.json` | 请求参数和产物路径 |

## 响应

```json
{
  "task_id": "20260429_170348_a281f881",
  "pipeline": "action_transfer",
  "status": "pending",
  "metadata_url": "/api/tasks/20260429_170348_a281f881",
  "output_dir": "/.../backend/code/result/task/20260429_170348_a281f881"
}
```

任务完成后查询：

```bash
curl "http://localhost:8000/api/tasks/{task_id}"
```

`output.video_path` 指向生成视频。

## 模型能力筛选

```bash
curl "http://localhost:8000/api/models?media_type=video&ability=action_transfer&verified_only=true"
```

## 前端入口

```text
http://localhost:3000/pipelines/action-transfer
```

前端支持通过文件管理器上传参考图片和动作视频。

## 注意事项

1. 动作迁移不支持标题/字幕叠加。
2. 输入图片和动作视频的主体差异过大时，身份保持可能变差。
3. 任务状态中的产物会展示图片、视频和音频；日志不会直接显示在任务状态面板中。
