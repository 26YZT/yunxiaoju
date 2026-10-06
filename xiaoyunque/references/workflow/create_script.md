# 生成剧本

执行第一阶段：剧本生成。

---

## 请求

```bash
curl -X POST "http://localhost:8000/api/project/{session_id}/execute/script_generation" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "xxx", "style": "anime", "episodes": 4}'
```

---

## 停点流程

现版本剧本生成阶段已精简，只有 1 个停点：

| 停点 | phase 值 | 操作 |
|------|----------|------|
| 2 | script_generation | 等待剧本生成完成，用户确认全集剧本 |

## 处理停点

### 停点2：剧本生成完成，等待用户确认后继续下一阶段

获取 artifact 查看生成的剧本内容：

```bash
# 获取 artifact
curl "http://localhost:8000/api/project/{session_id}/artifact/script_generation"
```

**必须向用户发送消息**，展示完整的剧本内容：

- **标题**：`artifact.title`
- **故事梗概**：`artifact.logline`
- **人物列表**：`artifact.characters`（包含人物名称、描述、角色类型）
- **背景列表**：`artifact.settings`（包含背景名称、描述）
- **剧集列表**：`artifact.episodes`（包含各集的标题和内容）

- **发送前端 URL**（获取本地 IPv4 地址，构造 `http://{local_ip}:3000/?session={session_id}&stage=script_generation`）

向用户展示剧本概览并询问确认后调用：

```bash
# 确认剧本，继续下一阶段
curl -X POST "http://localhost:8000/api/project/{session_id}/continue"
```

---

## SSE 事件监听

- `progress`: 实时进度，可能包含进度百分比等信息
- `stage_complete`: 阶段完成
- `error`: 执行出错

---

## 响应示例

```json
{
  "title": "剧本名称",
  "logline": "详细故事梗概",
  "characters": [
    {
      "name": "角色名",
      "character_id": "char_xxx",
      "description": "角色描述",
      "role": "主角"
    }
  ],
  "settings": [
    {
      "name": "场景名",
      "setting_id": "set_xxx",
      "description": "场景描述"
    }
  ],
  "episodes": [
    {
      "episode_number": 1,
      "act_title": "第一集标题",
      "content": "第一集的剧本正文内容"
    }
  ],
  "phase": "script_generation"
}
```

---

## 常见问题

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| `curl: (7) Failed to connect` | 后端未运行 | 启动后端服务 |
| `404 Not Found` | session_id 错误或 API 路径错误 | 确认 session_id 正确 |
| SSE 无响应 | 后端任务卡住 | 检查后端运行日志 |
| 用户不选择 | 用户仍在阅读剧本 | 耐心等待用户确认，不要自行决定点击下一步 |
