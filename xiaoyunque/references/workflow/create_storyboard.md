# 生成分镜

执行第三阶段：分镜设计。

---

## 请求

```bash
curl -X POST "http://localhost:8000/api/project/{session_id}/execute/storyboard" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "xxx"}'
```

---

## 停点说明

此阶段有 1 个停点：分镜设计完成后需要用户确认。

## 产物结构

```json
{
  "episodes": [
    {
      "episode_number": 1,
      "segments": [
        {
          "segment_id": "1-1",
          "scene_name": "场景名",
          "characters": ["角色A"],
          "plot": "分镜描述",
          "visual_prompt": "视觉提示词",
          "duration": 5,
          "setting_id": "set_xxx"
        }
      ]
    }
  ]
}
```

## 停点4：分镜设计完成，等待用户确认后继续下一阶段

**必须向用户发送消息**，展示完整的分镜列表：

按剧集和分镜顺序展示：

| 剧集 | 分镜ID | 时长 | 人物 | 地点 | 情节描述 |
|------|--------|------|------|------|----------|
| 第1集 | 1-1 | 5s | 角色A | 咖啡馆 | 两人在咖啡馆交谈 |

**发送消息时必须**：
- 使用文字形式发送表格（参考 [send_message/feishu.md](../send_message/feishu.md)）
- 包含按剧集统计的时长
- **发送前端 URL**（获取本地 IPv4 地址，构造 `http://{local_ip}:3000/?session={session_id}&stage=storyboard`）
- 发送完整列表后，询问用户确认

询问内容示例：
> "分镜设计已完成，共生成 X 集，总时长约 Y 秒。请确认是否继续生成参考图？"

## 继续下一阶段

用户确认后调用：

```bash
curl -X POST "http://localhost:8000/api/project/{session_id}/continue"
```

---

## 智能续写（可选）

用户可以要求续写分镜：

```bash
curl -X POST "http://localhost:8000/api/project/{session_id}/intervene" \
  -H "Content-Type: application/json" \
  -d '{"stage": "storyboard", "modifications": {"continue_story": true}}'
```

---

## 常见问题

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| `curl: (7) Failed to connect` | 后端未运行 | 启动后端服务 |
| 分镜数量太少 | LLM 生成不完整 | 询问用户是否需要续写 |
| 用户不确认 | 用户想修改分镜 | 调用 modify_storyboard 修改 |
| 续写失败 | 剧本内容不足 | 检查剧本阶段产物是否完整 |
