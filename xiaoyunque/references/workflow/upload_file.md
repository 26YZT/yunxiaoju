# 上传文档生成剧本

在创建视频工作流前，用户可以选择上传本地文档 (.txt, .md, .pdf, .doc, .docx) 来作为剧本素材。

---

## 阶段流程

当你需要根据用户提供的文件来生成剧本时，分两步执行：

### 1. 上传文件到服务器

后端提供了一个接收文件上传的接口，将文件保存到 `temp` 目录并返回相对路径。

```bash
# 假设用户提供的本地文件路径为 /path/to/local/file.txt
curl -X POST "http://localhost:8000/api/upload_file" \
  -F "file=@/path/to/local/file.txt"
```

**响应体示例**：
```json
{
  "filename": "file.txt",
  "file_path": "1720392941_file.txt"
}
```

### 2. 使用上传的文件创建项目

拿到 `file_path` 后，按照 `create_project.md` 的规范调用 `/api/project/start`。此时将 `file_path` 作为参数传入：

```bash
curl -X POST "http://localhost:8000/api/project/start" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "1720392941_file.txt",
    "idea": "如果用户有补充说明，填在这里；如果没有可留空",
    "style": "anime",
    "episodes": 4,
    "llm_model": "qwen3.5-plus"
  }'
```

---

> **⚠️ 注意事项**：
> 1. 上传的文件大小可能较大，不要尝试在终端里通过 `cat` 读取全卷内容发送给 LLM。利用后端的 `/api/project/start` 接口自带的解析功能（支持 PDF 和 Word）让后端自动处理。
> 2. 当 `file_path` 存在时，后端会自动将其解析内容和 `idea` 内容进行拼接。
