# 微信发送消息

## 注意事项

微信不支持 Markdown 语法，**不要使用 Markdown 表格**！

如果需要发送表格内容，改用**带缩进的编号列表**格式：

```markdown
1. 选项1：说明内容
   - 详情1
   - 详情2
2. 选项2：说明内容
   - 详情1
   - 详情2
3. 选项3：说明内容
   - 详情1
   - 详情2
```

---

## 微信发送图片/视频指南

### 使用方法

通过 OpenClaw 的 `message` 工具发送图片或视频到微信。

#### 方法一：使用 `filePath` 参数（推荐）

```python
message(
    action="send",
    filePath="/absolute/path/to/image.png"
)
```

#### 方法二：使用 `media` 参数

```python
message(
    action="send",
    media="/absolute/path/to/video.mp4"
)
```

### ⚠️ 重要提醒

1.  **必须使用绝对路径**
    *   ✅ 正确：`/path/to/image.png`
    *   ❌ 错误：`./image.png` 或 `image.png`
2.  **CDN 上传可能失败**
    *   错误信息：`CDN upload server error: status 500`
    *   解决方案：重试几次，或更换图片尝试。
3.  **单次发送数量**
    *   建议一次发送 1-3 张图片/视频。
    *   大量文件建议通过循环分批发送。

### 示例代码

#### 发送多张图片（循环示例）

```python
import os

image_dir = "/path/to/images"
for filename in os.listdir(image_dir):
    if filename.endswith(".png"):
        image_path = os.path.join(image_dir, filename)
        message(
            action="send",
            filePath=image_path
        )
```

#### 带文字说明发送

**必须分两步执行**（先发文字，再发多媒体）：

```python
# 1. 先发送文字说明
message(
    action="send",
    message="这是角色设计图："
)

# 2. 再发送图片
message(
    action="send",
    filePath="/path/to/image.png"
)
```

---

## 常见错误与解决方法

| 错误信息 | 原因 | 解决方法 |
| :--- | :--- | :--- |
| `CDN upload server error: status 500` | CDN 服务瞬时问题 | 等待后重试，或尝试压缩图片/更换格式 |
| `File not found` | 提供的路径不正确 | 检查是否使用了**绝对路径**且文件确实存在 |
| `requires target` | 缺少目标用户 | 确保在工具调用中通过 `to` 参数指定了接收者 |

---

## 相关工具

*   **message**: 发送消息和媒体文件（图片、视频、文件）。
*   **tts**: 文字转语音，生成的音频文件同样可以通过 `filePath` 发送。