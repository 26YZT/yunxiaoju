# Pipeline 总览

一次性 Pipeline 用于不需要六阶段人工停点的短流程任务。任务创建后在后台执行，前端通过 SSE 订阅进度，产物会实时登记到任务元数据中。

## 可用 Pipeline

| Pipeline | 前端名称 | API | 说明 |
|----------|----------|-----|------|
| `standard` | 文艺短视频 | `/api/pipelines/standard/tasks` | 输入创作灵感或完整文案，生成图片、TTS，并按「图片拼接 / 动态视频」模式合成成片 |
| `action_transfer` | 动作迁移 | `/api/pipelines/action_transfer/tasks` | 输入角色图片、动作视频和提示词，调用动作迁移视频模型 |
| `digital_human` | 数字人口播 | `/api/pipelines/digital_human/tasks` | 输入人物图片和口播文案，生成数字人口播视频 |

## 任务元数据与产物目录

```text
xiaoyunque/backend/code/data/tasks/{task_id}.json
xiaoyunque/backend/code/result/task/{task_id}/
```

任务元数据包含：

| 字段 | 说明 |
|------|------|
| `task_id` | 任务 ID |
| `pipeline` | pipeline 名称 |
| `status` | `pending` / `running` / `completed` / `failed` |
| `progress` | 0-100 进度 |
| `input` | 启动任务时传入的参数 |
| `output` | pipeline 返回的结构化结果 |
| `artifacts` | 产物列表，包含图片、音频、视频、文本 |
| `output_dir` | 产物目录 |

## 通用 API

### 查询任务列表

```bash
curl "http://localhost:8000/api/tasks?limit=100"
```

### 查询任务详情

```bash
curl "http://localhost:8000/api/tasks/{task_id}"
```

### 订阅任务事件

```bash
curl -N "http://localhost:8000/api/tasks/{task_id}/events"
```

事件类型：

| type | 说明 |
|------|------|
| `snapshot` | 当前任务快照 |
| `progress` | 进度更新 |
| `artifact` | 新产物生成 |
| `completed` | 任务完成 |
| `failed` | 任务失败 |

### 删除任务

```bash
curl -X DELETE "http://localhost:8000/api/tasks/{task_id}"
```

删除任务会同步删除任务元数据和对应产物目录。

## 上传媒体文件

文艺短视频不需要上传文件；动作迁移和数字人口播常需要上传图片或视频。

```bash
curl -X POST "http://localhost:8000/api/upload_media" \
  -F "file=@/path/to/file.png"
```

响应：

```json
{
  "filename": "file.png",
  "file_path": "/absolute/path/to/backend/code/result/task/uploads/xxx.png"
}
```

`file_path` 可直接作为 pipeline 请求参数传入。

## 模型列表与能力筛选

前端和 Agent 都应通过模型能力标签筛选可用模型。

```bash
curl "http://localhost:8000/api/models?media_type=image&ability=text_to_image&verified_only=true"
curl "http://localhost:8000/api/models?media_type=image&ability=reference_image&verified_only=true"
curl "http://localhost:8000/api/models?media_type=video&ability=action_transfer&verified_only=true"
curl "http://localhost:8000/api/models?media_type=video&ability=digital_human&verified_only=true"
```

常用能力：

| media_type | ability | 用途 |
|------------|---------|------|
| `image` | `text_to_image` | 文艺短视频文生图 |
| `video` | `image_to_video` | 文艺短视频动态视频模式 |
| `image` | `reference_image` | 数字人口播商品/人物参考图 |
| `video` | `action_transfer` | 动作迁移 |
| `video` | `digital_human` | 数字人口播 |

## 前端入口

| 页面 | URL |
|------|-----|
| YunXiaoJu 主流程 | `http://localhost:3000/` |
| 临时工作台 | `http://localhost:3000/sandbox` |
| 文艺短视频 | `http://localhost:3000/pipelines/standard` |
| 动作迁移 | `http://localhost:3000/pipelines/action-transfer` |
| 数字人口播 | `http://localhost:3000/pipelines/digital-human` |

## 注意事项

1. Pipeline 是一次输入、后台执行，中间无需人工干预。
2. 前端不轮询任务进度，而是通过 `/api/tasks/{task_id}/events` 订阅。
3. 产物显示时只展示图片、音频、视频；日志不作为任务状态内容展示。
4. 历史记录按 pipeline 分类展示，并支持删除。
