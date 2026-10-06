# 智能续写剧本

在完成完整视频生成后（或者任何用户觉得需要往下推进剧情的时间点），如果用户对当前故事满意并希望故事继续发展，可以请求智能续写功能。

---

## 阶段流程

当你需要根据已有的剧集内容，续写新的剧集时，按以下流程调用：

### 1. 发起续写请求

发送干预（Intervene）请求回溯给 `script_generation` 阶段，并在 `modifications` 中设置 `action: "smart_continue"`：

```bash
curl -X POST "http://localhost:8000/api/project/{session_id}/intervene" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "script_generation",
    "modifications": {
      "action": "smart_continue",
      "episodes_to_add": 1,
      "sequel_idea": "用户如果有后续主线想法可以填在此，不填空着让大模型自发散"
    }
  }'
```

* `episodes_to_add`: 希望追加生成的剧集数量（默认1）。
* `sequel_idea`: 续写的一句话灵感，若为空则由模型自动生成。

### 2. 等待生成并展示

该接口请求发起后，系统会自动根据之前的剧本记录生成新的设定、人物和新的剧集内容。完成后，获取新的 Artifact：

```bash
curl "http://localhost:8000/api/project/{session_id}/artifact/script_generation"
```
此时 `artifact` 中会多出 `new_episodes`、`new_characters`、`new_settings` 等字段。

**必须向用户发送消息**，展示：
1. **续写灵感**：`artifact.sequel_idea`
2. **新增剧情**：`artifact.new_episodes` 列表。
3. **新增角色和场景**（若有）。

并询问用户：“是否确认将以上续写内容并入主剧本中？”

### 3. 确认或取消续写

等待用户反馈。如果用户：

**同意 / 满意**：合并这些续集。
```bash
curl -X POST "http://localhost:8000/api/project/{session_id}/intervene" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "script_generation",
    "modifications": {
      "action": "confirm_continue"
    }
  }'
```
（系统将在后台自动合并新老剧集数据，同步跨阶段变量等，之后你可以引导用户进行下一步或者继续看完整剧本）

**不同意 / 取消**：放弃本次续写。
```bash
curl -X POST "http://localhost:8000/api/project/{session_id}/intervene" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "script_generation",
    "modifications": {
      "action": "delete_continue"
    }
  }'
```
（系统在后台抛弃刚才的新增内容）
