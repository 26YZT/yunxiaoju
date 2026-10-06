# 数字人口播

数字人口播对应 `digital_human` pipeline。它接收人物图片和口播文案，先按句号切分文案并逐句生成 TTS，再调用数字人口播/参考图生视频模型生成分段视频，最后使用生成的 TTS 音频替换视频音频并拼接成片。

## 请求

```bash
curl -X POST "http://localhost:8000/api/pipelines/digital_human/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "character_image_path": "/absolute/path/to/person.png",
    "goods_image_path": "/absolute/path/to/product.png",
    "goods_title": "",
    "goods_text": "大家好，今天给大家介绍这款产品。它使用方便，适合日常高频场景。",
    "llm_model": "qwen3.5-plus",
    "image_model": "wan2.7-image",
    "video_model": "wan2.7-r2v",
    "video_ratio": "9:16",
    "tts_voice": "zh-CN-YunjianNeural",
    "tts_speed": 1.2,
    "negative_prompt": ""
  }'
```

## 参数说明

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `character_image_path` | ✅ | | 人物图片路径，可使用上传接口返回的 `file_path` |
| `goods_image_path` | | | 商品图片路径，可选 |
| `goods_title` | | | 商品/口播标题，可选，留空时由 LLM 根据文案生成 |
| `goods_text` | ✅ | | 口播文案 |
| `llm_model` | | 后端默认 | 标题生成使用的 LLM |
| `image_model` | | | 有商品图片时可用于生成数字人口播参考图 |
| `video_model` | | `wan2.7-r2v` | 需支持 `digital_human` 能力 |
| `video_ratio` | | `9:16` | 视频比例 |
| `tts_voice` | | `zh-CN-YunjianNeural` | Edge TTS 声音 |
| `tts_speed` | | `1.2` | TTS 语速 |
| `negative_prompt` | | | 视频负向提示词 |
| `watermark` | | | 是否保留模型水印 |
| `prompt_extend` | | | 是否启用模型提示词扩展 |

## 处理逻辑

1. 复制人物图片和商品图片到任务产物目录。
2. 如果标题为空，用 LLM 根据 `goods_text` 生成标题。
3. 如果提供商品图片和图片模型，先生成一张数字人口播参考图。
4. 按所有句号切分口播文案。
5. 每句先生成 TTS。
6. 如果单句音频超过视频模型时长上限，则对该句音频倍速压缩到模型上限。
7. 每段视频只使用当前音频段的文案作为提示词。
8. 多段视频生成时，截取前一段尾帧作为下一段首帧参考。
9. 拼接视频后静音，并使用生成的最终 TTS 音频替换视频音频。

## 字幕与标题

数字人口播不支持“添加标题和字幕”。前端不会显示该开关，后端也不会生成或烧录字幕文件。

## 上传媒体

```bash
curl -X POST "http://localhost:8000/api/upload_media" \
  -F "file=@/path/to/person.png"

curl -X POST "http://localhost:8000/api/upload_media" \
  -F "file=@/path/to/product.png"
```

把响应中的 `file_path` 填入 `character_image_path` 和 `goods_image_path`。

## 产物

产物目录：

```text
xiaoyunque/backend/code/result/task/{task_id}/
```

常见产物：

| 文件 | 说明 |
|------|------|
| `script.txt` | 最终口播文案 |
| `character.*` | 复制后的人物图片 |
| `goods.*` | 复制后的商品图片 |
| `generated_reference.*` | 可选，生成的数字人口播参考图 |
| `narration_sentence_XX.mp3` | 每句 TTS |
| `narration_sentence_XX_speed.mp3` | 超长句倍速后的 TTS |
| `video_part_XX.mp4` | 分段数字人口播视频 |
| `tail_frame_XX.jpg` | 多段生成时提取的尾帧 |
| `final_narration.mp3` | 拼接后的完整 TTS |
| `final.mp4` | 替换为生成音频后的最终视频 |
| `request.json` | 请求参数和产物路径 |

## 响应

```json
{
  "task_id": "20260429_170348_a281f881",
  "pipeline": "digital_human",
  "status": "pending",
  "metadata_url": "/api/tasks/20260429_170348_a281f881",
  "output_dir": "/.../backend/code/result/task/20260429_170348_a281f881"
}
```

任务完成后查询：

```bash
curl "http://localhost:8000/api/tasks/{task_id}"
```

`output.video_path` 指向最终视频。

## 模型能力筛选

```bash
curl "http://localhost:8000/api/models?media_type=video&ability=digital_human&verified_only=true"
curl "http://localhost:8000/api/models?media_type=image&ability=reference_image&verified_only=true"
```

## 前端入口

```text
http://localhost:3000/pipelines/digital-human
```

## 注意事项

1. 人物图片和口播文案必填；商品图片和商品标题可选。
2. 标题留空时会由 LLM 生成。
3. 数字人口播使用生成的 TTS 音频作为最终音频，不保留视频模型自带音频。
4. 对于多段视频，尾帧衔接可以提升连续性，但仍取决于底层模型能力。
