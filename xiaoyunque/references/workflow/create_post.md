# 后期剪辑

执行第六阶段：将所有视频片段按剧集分组拼接成完整的各集视频。

## 请求

```bash
curl -X POST "http://localhost:8000/api/project/{session_id}/execute/post_production" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "xxx"}'
```

## 停点说明

此阶段**无停点**，直接执行完成。

## 产物结构

```json
{
  "final_videos": [
    {
      "episode": 1,
      "path": "code/result/video/xxx/output/xxx_ep1.mp4",
      "name": "第 1 集"
    },
    {
      "episode": 2,
      "path": "code/result/video/xxx/output/xxx_ep2.mp4",
      "name": "第 2 集"
    }
  ],
  "final_video": "code/result/video/xxx/output/xxx_ep1.mp4"
}
```

## 完成提示

全部阶段完成后，告知用户：
- 各剧集的阶段视频已分别生成完毕
- **发送前端 URL**（获取本地 IPv4 地址，构造 `http://{local_ip}:3000/?session={session_id}&stage=post_production`）
- 提取所有的 `artifact.final_videos`，按集数依次**将生成的视频文件发送给用户**，并带上集数名称说明（如"第 1 集成片已生成"）
- 提供 Web 界面链接供用户查看和下载

```bash
curl "http://localhost:8000/api/project/{session_id}/artifact/post_production"
```

## 常见问题

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| `curl: (7) Failed to connect` | 后端未运行 | 启动后端服务 |
| 拼接失败 | 部分视频片段缺失或损坏 | 检查 video_generation 阶段的产物 |
| final_video 为空 | 所有视频片段生成失败 | 回退到 video_generation 阶段重新生成 |
| 视频时长为 0 | FFmpeg 处理失败 | 检查后端日志 |