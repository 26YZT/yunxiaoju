<div align="center">
  <img src="xiaoyunque/xiaoyunque/frontend/public/brand/cloud-icon.svg" width="80" alt="云小剧云朵标志" />
  <h1>云小剧 · YunXiaoJu</h1>
  <p>把故事做成可以逐步打磨的 AI 短片。</p>
  <p><b>简体中文</b> · <a href="README_EN.md">English</a> · <a href="LICENSE">MIT License</a></p>
</div>

云小剧是一个本地运行的 AI 短片／短剧创作工作台。它把创作组织为六个阶段，保留中间素材，让创作者查看结果、选择版本并继续调整。

![云小剧创作台](docs/ui/yunxiaoju-home.png)

## 功能

- **六阶段工作流**：剧本 → 角色／场景 → 分镜 → 参考图 → 视频片段 → 分集后期合成。
- **逐步创作与自动模式**：逐阶段确认，或自动推进已完成阶段；需要补充素材时暂停。
- **素材版本与修改**：角色、参考图、视频版本选择；局部再生成；剧本与分镜编辑。
- **三条快捷管线**：文艺短视频、动作迁移、数字人口播。
- **独立生成工具**：文本生成、图片理解、文生图、图生图、视频生成。
- **可配置模型**：接入 DashScope、ARK、Kling、OpenAI、Gemini、DeepSeek 等适配器。实际可用模型取决于服务商与账号权限。
- **云朵品牌与深色界面**：支持灵感分类、故事回填、按需展开参数和移动端导航。

当前是持续开发中的本地应用，**没有无限画布或多人协作功能**。

## 快速开始

### 环境

- Python **3.10+**，推荐 3.12。
- Node.js **20.9+**，推荐 Node.js 22 LTS；npm。
- **ffmpeg 和 ffprobe**：成片合成、音频处理需要。
- 可选：`uv`。HTML 模板渲染需要 Playwright Chromium。

```bash
git clone https://github.com/26YZT/yunxiaoju.git
cd yunxiaoju
```

项目暂时保留原有目录结构，实际应用在 `xiaoyunque/xiaoyunque/`。

### 安装与运行后端

```bash
cd xiaoyunque/xiaoyunque/backend
python3 -m venv .venv
source .venv/bin/activate
# Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt
cp config.yaml.example config.yaml
# Windows: copy config.yaml.example config.yaml
python api_server.py
```

后端默认地址：`http://127.0.0.1:8000`，接口文档：`http://127.0.0.1:8000/docs`。

使用 HTML 字幕模板前，可在同一 Python 环境安装渲染浏览器：

```bash
python -m playwright install chromium
```

### 安装与运行前端

另开一个终端，从仓库根目录执行：

```bash
cd xiaoyunque/xiaoyunque/frontend
npm ci
npm run dev
```

打开 **http://localhost:3000**。生产构建可使用：

```bash
npm run build -- --webpack
npm start
```

也可从应用目录运行 `./install.sh`（macOS/Linux）或 `install.bat`（Windows）；安装脚本会安装依赖并准备配置。

## 配置模型

在前端「设置 → 模型服务」填写对应服务商的密钥，在「创作默认值」选择模型和生成参数；也可编辑 `backend/config.yaml`。

- 浏览界面和模型列表不需要发起生成。
- 真实生成需要有效的服务商密钥，可能产生服务商费用。
- `config.yaml`、环境文件、生成素材和会话记录已被 Git 忽略；请勿把密钥填写到 `config.yaml.example`。
- 模型名称、能力和并发配置见 `backend/models/config_model.py`。其中的能力验证标签是项目元数据，不保证服务商当前可用性。

## 项目结构

```text
yunxiaoju/
├── README.md / README_EN.md
├── LICENSE / NOTICE
├── DESIGN.md                   # 品牌、界面参考与设计约定
├── docs/ui/                    # 界面截图（含明确标记的测试素材）
└── xiaoyunque/
    ├── SKILL.md / references/   # 外部 Agent 接入说明
    └── xiaoyunque/
        ├── install.sh / install.bat
        ├── backend/
        │   ├── api/            # FastAPI 路由与请求结构
        │   ├── core/           # 编排器与六阶段 Agent
        │   ├── models/         # 服务商适配与模型注册
        │   ├── pipelines/      # 快捷视频管线
        │   ├── prompts/        # 提示词
        │   ├── templates/      # 字幕与图文模板
        │   └── tests/          # 安全回归
        └── frontend/
            ├── app/            # Next.js 页面
            ├── components/     # 工作台、阶段组件与共享 UI
            ├── config/         # 品牌、工作流、灵感配置
            └── lib/            # API 客户端
```

主流程会话写入 `backend/code/data/sessions/`，管线任务写入 `backend/code/data/tasks/`，媒体写入 `backend/code/result/`。这些目录只在本地运行时产生，不包含在仓库中。

## 开发验证与已知限制

```bash
# 后端（已激活对应虚拟环境）
cd xiaoyunque/xiaoyunque/backend
python -m unittest discover -s tests -v

# 前端
cd xiaoyunque/xiaoyunque/frontend
npx tsc --noEmit --incremental false
npm run lint
npm run build -- --webpack
```

最近一次本地检查（2026-10-07）：TypeScript、Webpack 生产构建和 8 项安全回归通过。界面已检查六个主要页面与六阶段组件；部分阶段使用模拟数据进行 UI 验收，尚未完成真实模型端到端出片验收。

待完善事项：

- 全量 ESLint 仍有既有类型与 Hooks 问题。
- 素材完整性判定、取消／重启后的状态恢复、上游修改后的下游失效处理需要继续完善。
- 六阶段自动推进部分由前端驱动；后台任务尚不是持久化任务队列。
- 当前应用没有用户鉴权与多租户隔离，面向本机使用。

## 来源与许可

本项目在所提供的 **XiaoYunQue / Video-Claw** 源码基础上进行品牌和前端改造。保留原始 MIT 许可及版权声明，详见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。相关上游：[HITsz-TMG/VideoClaw](https://github.com/HITsz-TMG/VideoClaw)。

独立的 FilmAgent 研究归档、旧宣传素材和本地运行资料不随本仓库发布。第三方模型服务的使用遵循各自服务条款。
