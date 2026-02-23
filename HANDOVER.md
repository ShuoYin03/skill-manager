# Handover Document

Last Updated: 2026-02-23

---

## 项目概述

**repo-launcher** — 一个 Electron 桌面工具，核心功能是：
1. **Launcher** — Spotlight 风格的快速打开 repo，支持全局热键
2. **Skills Manager** — 管理 AI 工具技能文件（CLAUDE.md、.cursorrules 等）
3. **Marketplace** — 浏览、搜索并安装来自 skills.sh 的技能（17,310 条记录）
4. **Instructions Editor** — 管理各 AI 工具的 instruction 文件
5. **Settings** — 编辑器选择、主题、热键、账户、License

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Electron 40.x + electron-vite |
| 前端 | React 18 + TypeScript 5.6 |
| 数据库 | better-sqlite3 12.6.2（原生模块） |
| 认证 | Supabase OAuth（Google） |
| 设置持久化 | electron-store |
| 模糊搜索 | Fuse.js |
| HTML→Markdown | Turndown + turndown-plugin-gfm |
| Git 信息 | simple-git |
| 图标 | simple-icons |

---

## 文件架构

```
src/
├── main/                         # Electron 主进程
│   ├── index.ts                  # 应用入口，初始化所有服务
│   ├── ipc-handlers.ts           # 所有 IPC 事件注册
│   ├── window.ts                 # 窗口管理（Launcher + Marketplace）
│   ├── tray.ts                   # 系统托盘
│   ├── shortcut.ts               # 全局快捷键
│   ├── store.ts                  # electron-store 持久化存储
│   ├── auth-service.ts           # Supabase OAuth 认证
│   ├── license-service.ts        # License 验证
│   ├── trial-service.ts          # 试用期管理
│   ├── git-service.ts            # Git 分支检测
│   ├── editor-launcher.ts        # 在编辑器中打开 repo
│   ├── protocol-handler.ts       # 自定义协议 repo-launcher://
│   ├── config.ts                 # Supabase 配置
│   ├── skills-db.ts              # SQLite 数据库层（marketplace）
│   ├── skills-scraper.ts         # Sitemap 爬虫（~4,000 skills）
│   ├── skills-scraper-api.ts     # API 爬虫（~17,000 skills）
│   ├── skills-marketplace.ts     # Marketplace 查询逻辑
│   ├── skills-scanner.ts         # 扫描 repo 内的技能文件
│   ├── skills-io.ts              # 创建/更新/删除技能文件
│   └── memory-files.ts           # Instruction 文件管理
├── preload/
│   └── index.ts                  # contextBridge 暴露 electronAPI
├── renderer/src/
│   ├── App.tsx                   # 路由：launcher/settings/marketplace
│   ├── context/AppContext.tsx    # 全局状态
│   ├── components/
│   │   ├── Launcher/             # 主 Launcher UI
│   │   ├── Settings/             # 设置页面
│   │   └── Skills/               # Skills 管理 + Marketplace UI
│   └── styles/                   # CSS 样式文件
└── shared/
    ├── types.ts                  # 共享 TypeScript 类型
    └── constants.ts              # IPC 频道名称常量

scripts/
├── scrape-marketplace.ts         # CLI: npm run scrape（sitemap 爬虫）
└── scrape-marketplace-api.ts     # CLI: npm run scrape-all（API 爬虫）

data/
└── marketplace.db                # SQLite 数据库（开发环境）
```

---

## 数据库设计

**位置（开发环境）：** `{project_root}/data/marketplace.db`

> ⚠️ 旧文档（IMPLEMENTATION_HANDOVER.md）中的 `~/Library/Application Support/desktop-tool/marketplace.db` 路径已过时。当前代码（`skills-db.ts:30`）将数据库放在项目根目录的 `data/` 文件夹。

```sql
CREATE TABLE skills (
  slug TEXT PRIMARY KEY,        -- "owner/repo/skillId"
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  skillId TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,                 -- SKILL.md 内容（可能为 NULL）
  contentFetchedAt TEXT,
  contentError TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_owner ON skills(owner);
CREATE INDEX idx_skills_repo ON skills(repo);
CREATE INDEX idx_skills_name ON skills(name);

CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**当前数据库状态（2026-02-23）：**

| 指标 | 数值 |
|---|---|
| 总技能数 | 17,310 |
| 来源 sitemap | ~4,000 |
| API 新增 | ~13,310 |
| 内容覆盖 | 约 4,000 有完整内容，其余仅有元数据 |
| API 爬虫进度 | 已完成 aa→vc（约 80% 完成），convergence 停止 |

**Metadata 键：**
- `lastScraped` — sitemap 爬虫最后执行时间
- `count` — sitemap 爬取到的技能数量
- `contentFetchedAt` — 内容批量获取的最后执行时间
- `apiLastScraped` — API 爬虫最后执行时间
- `apiScrapeProgress` — API 爬虫断点续传 JSON
- `apiTotalDiscovered` — 当次 API 爬虫发现的技能数（注：此值是按次重置的，不是 DB 总量）

---

## IPC API 完整列表

| IPC 频道 | 作用 |
|---|---|
| `repos:get-all` | 获取所有 repo（含 git 分支） |
| `repos:add` | 打开目录选择器添加 repo |
| `repos:remove` / `repos:update` | 删除/更新 repo |
| `repos:refresh-branches` | 刷新所有 git 分支 |
| `editor:open` | 在指定编辑器中打开 repo |
| `editor:get-available` | 获取当前系统可用的编辑器 |
| `settings:get` / `settings:update` | 读写 app 设置 |
| `window:hide` | 隐藏 Launcher 窗口 |
| `get:home-dir` | 获取用户 home 目录 |
| `marketplace:open` | 打开 Marketplace 窗口 |
| `auth:sign-in` / `auth:sign-out` / `auth:get-session` | Supabase OAuth |
| `license:get-status` / `license:verify` | License 状态 |
| `skills:scan-repo` / `skills:scan-all` | 扫描 repo 中的技能文件 |
| `skills:create` / `skills:update` / `skills:delete` / `skills:toggle` / `skills:globalize` | CRUD 技能文件 |
| `skills:presets:get` / `save` / `delete` / `apply` | 技能预设管理 |
| `skills:marketplace:search` | 搜索 marketplace 技能（支持分页/过滤） |
| `skills:marketplace:get` | 获取单个技能内容 |
| `skills:marketplace:install` | 安装技能到 repo |
| `skills:marketplace:filter-stats` | 获取 tag/author 统计 |
| `instructions:scan` / `read` / `write` / `globalize` | Instruction 文件管理 |

---

## 爬虫系统

### 方式一：`npm run scrape`（sitemap 爬虫）

```bash
npm rebuild better-sqlite3 && tsx scripts/scrape-marketplace.ts && npx electron-rebuild -f -w better-sqlite3
```

- 解析 `https://skills.sh/sitemap.xml`
- 支持 sitemap index（多级 sitemap）
- 获取约 4,000 条技能
- 每条技能用 3 种策略获取内容：
  1. GitHub raw URL（最可靠）
  2. skills.sh HTML 页面（Turndown 转 Markdown）
  3. 占位符（最终回退）
- 并发 5，批次间隔 200ms

### 方式二：`npm run scrape-all`（API 爬虫）

```bash
npm rebuild better-sqlite3 && tsx scripts/scrape-marketplace-api.ts && npx electron-rebuild -f -w better-sqlite3
```

- 遍历 676 个两字母组合（aa-zz）查询 skills.sh API
- API 端点：`https://skills.sh/api/search?q={query}&limit=100&offset={offset}`
- 并发 3，批次间隔 500ms
- 支持断点续传（进度存 `metadata.apiScrapeProgress`）
- Convergence 检测：连续 50 个 query 没有新技能则停止
- 获取约 17,310 条技能（不包含内容，仅元数据）

> **注意：** API 爬虫只写入元数据（slug、owner、repo、skillId、name），不获取 content。需要再运行 `npm run scrape` 获取内容，或等技能被查看时回退到 `fetchSkillContent()`。

### better-sqlite3 编译问题

better-sqlite3 是 C++ 原生模块，需要针对不同运行时分别编译：
- **Node.js（tsx）：** MODULE_VERSION 131
- **Electron：** MODULE_VERSION 143

两个 scrape 脚本都会在运行前后自动处理。但如果脚本中途中断，`npm run dev` 会报错：

```
Error: The module was compiled against a different Node.js version
using NODE_MODULE_VERSION 131. This version of Node.js requires
NODE_MODULE_VERSION 143.
```

**修复方法：**
```bash
npx electron-rebuild -f -w better-sqlite3
```

---

## 窗口配置

| 窗口 | 尺寸 | 特性 |
|---|---|---|
| Launcher | 680×480 | 无边框、透明、置顶、失焦自动隐藏、macOS vibrancy |
| Marketplace | 1200×800（最小 800×600） | 有边框、可调整大小 |

Marketplace 窗口通过 hash 路由打开：`#view=marketplace`

---

## Instruction 文件支持

| AI 工具 | 文件路径 |
|---|---|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| Windsurf | `.windsurfrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |

支持操作：扫描现有文件、读取内容、编辑并写回、全局化（复制到所有 repo）

---

## 已知问题

### 1. Marketplace 内容覆盖不完整
- API 爬虫（17,310 条）只存元数据，不抓内容
- 只有 sitemap 爬虫获取的 ~4,000 条有 content
- 其余 13,000+ 条在用户查看时显示"run scraper"提示
- **修复方向：** 在 `npm run scrape-all` 后加一步 `batchFetchSkillContent()` 补充内容

### 2. skills.sh 覆盖率差距
- skills.sh 显示 71,667 个技能，目前只爬到 17,310（约 24%）
- aa-zz 枚举策略只能匹配特定命名的技能
- **修复方向：** 增加 3 字母组合（aaa-zzz）或按已知 owner 枚举

### 3. API Scraper Convergence 过早停止
- 当前 `convergenceThreshold = 50`，在 "vc" 处停止
- 剩余 vc-zz 约 80+ 个查询未执行
- 下次运行 `npm run scrape-all` 会从 vc 断点续传

### 4. `apiTotalDiscovered` metadata 值不准确
- 此值只记录当次运行发现的新技能数，不是数据库总量
- 实际总量应从 `SELECT COUNT(*) FROM skills` 查询

---

## 开发工作流

```bash
# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建
npm run build

# 爬取 marketplace 技能（sitemap，快速，~2分钟）
npm run scrape

# 爬取全量技能（API，慢速，~20分钟）
npm run scrape-all

# 如果 npm run dev 报 MODULE_VERSION 错误
npx electron-rebuild -f -w better-sqlite3

# 查看数据库状态
sqlite3 data/marketplace.db "SELECT COUNT(*) as total FROM skills;"
sqlite3 data/marketplace.db "SELECT key, value FROM metadata;"

# 打包 macOS
npm run build:mac
```

---

## Progress Against Final Goal

- [x] Spotlight 风格 Launcher（repo 搜索、打开编辑器）
- [x] 系统托盘 + 全局热键
- [x] Git 分支显示
- [x] Settings（编辑器、主题、热键、登录启动）
- [x] Supabase OAuth 认证
- [x] License / Trial 系统
- [x] Skills 管理（scan、create、edit、delete、toggle、globalize）
- [x] Skills 预设（保存/应用一组 skill）
- [x] Marketplace（SQLite + 搜索/分页/过滤）
- [x] Marketplace 爬虫（sitemap: ~4,000 条，API: ~17,310 条）
- [x] Instruction 文件管理（CLAUDE.md、.cursorrules 等）
- [ ] Marketplace 内容全覆盖（当前 ~4,000 有内容，13,000+ 无内容）
- [ ] Marketplace 覆盖率提升（目前 17,310 / 71,667 = 24%）

---

## 关键文件快速索引

| 需要改什么 | 看哪里 |
|---|---|
| 添加新 IPC 事件 | `shared/constants.ts` → `ipc-handlers.ts` → `preload/index.ts` |
| 修改 Marketplace 搜索逻辑 | `skills-db.ts:searchSkills()` + `skills-marketplace.ts` |
| 修改爬虫策略 | `skills-scraper.ts`（sitemap）或 `skills-scraper-api.ts`（API） |
| 修改 Launcher UI | `components/Launcher/` |
| 修改 Marketplace UI | `components/Skills/MarketplaceStandaloneView.tsx` |
| 修改 Settings | `components/Settings/` + `store.ts` |
| 添加新 Instruction 工具支持 | `memory-files.ts:MEMORY_FILE_CONFIG` |
| 修改窗口大小/行为 | `window.ts` |
| 修改认证流程 | `auth-service.ts` + `protocol-handler.ts` |

---

## 其他文档

| 文件 | 内容 |
|---|---|
| `IMPLEMENTATION_HANDOVER.md` | SQLite 迁移详细记录（2026-02-22，部分过时） |
| `SCRAPER_COMPLETION_SUMMARY.md` | 爬虫完成报告（2026-02-22） |
| `DEPLOYMENT.md` | 部署相关（如有） |
