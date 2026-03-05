# Handover Document

Last Updated: 2026-03-04

---

## 项目概述

**Skilly（前称 repo-launcher）** — macOS Electron 桌面工具，核心功能：

1. **Launcher** — Spotlight 风格的快速打开 repo，支持全局热键（默认 `Cmd+Shift+O`）
2. **Skills Manager** — 管理 AI 工具技能文件（`.claude/skills/*.md`、`.cursor/rules/*` 等）
3. **Marketplace** — 嵌入主窗口（非独立窗口），浏览/搜索/安装来自 skills.sh 的技能
4. **Instructions Editor** — 管理 AI 工具的 instruction 文件（CLAUDE.md、.cursorrules 等）
5. **Settings** — 编辑器选择、主题、热键、账户、License

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Electron 40.x + electron-vite |
| 前端 | React 18 + TypeScript 5.6 |
| **Marketplace DB** | **Supabase PostgreSQL（已从 SQLite 迁移）** |
| 认证 | Supabase OAuth（Google）+ PKCE 流程 + 本地 HTTP server |
| 设置持久化 | electron-store |
| 模糊搜索 | Fuse.js |
| HTML→Markdown | Turndown + turndown-plugin-gfm |
| Git 信息 | simple-git |
| 图标 | simple-icons |

> ⚠️ **重要架构变更（2026-02-24 之后）：** Marketplace 数据库已从本地 SQLite（`skills-db.ts`）迁移到 Supabase PostgreSQL（`skills-supabase.ts`）。`skills-db.ts` 文件已删除，`better-sqlite3` 依赖已移除。

---

## 文件架构

```
src/
├── main/
│   ├── index.ts                  # 应用入口；初始化 Supabase、trial、shortcut
│   ├── ipc-handlers.ts           # 所有 IPC 事件注册
│   ├── window.ts                 # 窗口管理（Launcher）
│   ├── tray.ts                   # 系统托盘（macOS: 左键=show, 右键=menu）
│   ├── shortcut.ts               # 全局快捷键（suspend/resume/update）
│   ├── store.ts                  # electron-store 持久化
│   ├── config.ts                 # Supabase URL + Anon Key（公开可船送）
│   ├── auth-service.ts           # Supabase OAuth（PKCE + local HTTP server）
│   ├── oauth-local-server.ts     # 本地 HTTP 服务器接收 OAuth code（端口 57235-57238）
│   ├── license-service.ts        # License 验证（Supabase Edge Function）
│   ├── trial-service.ts          # 7 天试用期
│   ├── git-service.ts            # Git 分支 + last commit 检测
│   ├── editor-launcher.ts        # 在编辑器中打开 repo
│   ├── protocol-handler.ts       # 自定义协议（skilly://）
│   ├── skills-supabase.ts        # Supabase 数据访问层（替代已删除的 skills-db.ts）
│   ├── skills-scraper.ts         # Sitemap 爬虫（~4,000 skills）
│   ├── skills-scraper-api.ts     # API 爬虫（~17,000 skills）
│   ├── skills-marketplace.ts     # Marketplace 查询逻辑（含 8 条 BUNDLED_SKILLS 离线回退）
│   ├── skills-scanner.ts         # 扫描 repo 内的技能文件（支持平铺文件 + 子目录 SKILL.md）
│   ├── skills-io.ts              # 创建/更新/删除技能文件（支持 git clone 多文件安装）
│   └── memory-files.ts           # Instruction 文件管理
├── preload/
│   └── index.ts                  # contextBridge 暴露 electronAPI
├── renderer/src/
│   ├── App.tsx                   # 路由：launcher / settings / marketplace（三路分发）
│   ├── context/AppContext.tsx    # 全局状态（ViewMode、repos、settings、auth）
│   ├── components/
│   │   ├── Launcher/             # 主 Launcher UI（repo 列表、搜索、热键提示）
│   │   │   ├── LauncherView.tsx
│   │   │   ├── RepoList.tsx
│   │   │   ├── RepoListItem.tsx  # 三点菜单（Remove）+ 底部 Open 按钮
│   │   │   ├── RepoContextMenu.tsx
│   │   │   ├── EditorPicker.tsx
│   │   │   └── ...
│   │   ├── Settings/             # 设置页面（Account + General）
│   │   └── Skills/               # Skills 管理 + Marketplace UI
│   │       ├── MarketplaceEmbeddedView.tsx   # 主 Marketplace（嵌入式，当前使用）
│   │       ├── MarketplaceStandaloneView.tsx  # 独立窗口版（legacy，hash=#view=marketplace）
│   │       ├── SkillsPanel.tsx    # 右侧面板（Info/Skills/Presets 三 Tab）
│   │       ├── RepoInfoView.tsx   # Info tab：路径/分支/last commit/语言分布
│   │       ├── SkillsList.tsx     # Skills tab：按 tool 分组，支持 filter
│   │       ├── PresetsView.tsx    # Presets tab
│   │       ├── InstructionsView.tsx / InstructionsEditor.tsx
│   │       └── ...
│   └── styles/
│       ├── launcher.css
│       └── skills.css
└── shared/
    ├── types.ts                  # 共享类型
    └── constants.ts              # IPC 频道名称

scripts/
├── scrape-marketplace.ts         # CLI: npm run scrape（sitemap 爬虫）
└── scrape-marketplace-api.ts     # CLI: npm run scrape-all（API 爬虫）
```

---

## Supabase 配置（关键）

### 项目信息
- **URL:** `https://lybfswqxojpofftfifrf.supabase.co/`
- **Anon Key:** 在 `src/main/config.ts` 中，已提交代码（公开的 anon key，仅允许 SELECT）

### 数据库表结构（PostgreSQL）

```sql
-- 技能表
CREATE TABLE marketplace_skills (
  slug TEXT PRIMARY KEY,           -- "owner/repo/skillId"
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  content_fetched_at TIMESTAMPTZ,
  content_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  installs INTEGER DEFAULT 0
);

-- 元数据表
CREATE TABLE marketplace_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE marketplace_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON marketplace_skills FOR SELECT USING (true);
CREATE POLICY "Public read" ON marketplace_metadata FOR SELECT USING (true);

-- 必须显式授权 anon 角色（RLS policy 之外还需要 GRANT）
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON marketplace_skills TO anon;
GRANT SELECT ON marketplace_metadata TO anon;
GRANT EXECUTE ON FUNCTION get_marketplace_filter_stats() TO anon;

-- Filter stats RPC
CREATE OR REPLACE FUNCTION get_marketplace_filter_stats()
RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'tags',    (SELECT json_agg(row_to_json(t)) FROM (SELECT repo as name, COUNT(*) as count FROM marketplace_skills GROUP BY repo ORDER BY count DESC LIMIT 20) t),
    'authors', (SELECT json_agg(row_to_json(a)) FROM (SELECT owner as name, COUNT(*) as count FROM marketplace_skills GROUP BY owner ORDER BY count DESC LIMIT 15) a)
  );
$$;
```

### Supabase Dashboard 配置状态（2026-03-04 确认）

1. **Authentication → Redirect URLs** ✅ 已配置：
   - `https://skilly-azure.vercel.app/auth/callback`
   - `http://localhost:57235/callback`
   - `http://localhost:57236/callback`
   - `http://localhost:57237/callback`
   - （可选）`http://localhost:57238/callback`

2. **GRANT 权限** ✅ 已执行

3. **marketplace_skills 表数据** ✅ 已确认：**25,728 条记录**（`SELECT COUNT(*) FROM marketplace_skills` = 25728）

4. **待排查** ⚠️：生产版本（`npm run build:mac`）里 Marketplace 仍显示 8 条离线数据，
   dev 版本未测试。已在 `MarketplaceEmbeddedView` 加入错误诊断（banner 显示实际 Supabase 错误信息），
   需重新构建后检查 banner 文本来定位根因。

---

## OAuth 登录流程（重要）

Electron 使用 RFC 8252 标准的 loopback redirect 流程：

1. `signIn()` 启动本地 HTTP server（监听 `localhost:57235`）
2. 调用 `supabase.auth.signInWithOAuth({ redirectTo: 'http://localhost:57235/callback' })`
3. `shell.openExternal(data.url)` — 在用户系统浏览器打开 Google OAuth
4. 浏览器完成授权后，Google → Supabase → redirect 到 `http://localhost:57235/callback?code=xxx`
5. 本地 HTTP server 接收 `code`，调用 `supabase.auth.exchangeCodeForSession(code)`
6. 保存 access_token + refresh_token 到 electron-store
7. 主进程通过 `win.webContents.send('auth:callback', user)` 通知渲染进程

> 这是**正确的生产架构**，localhost redirect 不是 bug。问题只是 Supabase Dashboard 没有把 localhost 加到允许列表。

---

## App 路由架构

```
App.tsx
├── if hash === '#view=marketplace' → <MarketplaceStandaloneView />（独立窗口，legacy）
└── else → <AppProvider><AppInner /></AppProvider>
    ├── currentView === 'launcher'     → <LauncherView />
    ├── currentView === 'marketplace'  → <MarketplaceEmbeddedView />
    └── currentView === 'settings'     → <SettingsView />
```

**ViewMode** = `'launcher' | 'settings' | 'marketplace'`（定义在 `shared/types.ts`）

---

## AppSettings 字段

```typescript
interface AppSettings {
  globalHotkey: string          // 默认 'CommandOrControl+Shift+O'
  defaultEditor: EditorId       // 默认 'vscode'
  theme: 'light' | 'dark' | 'system'
  launchAtLogin: boolean
  skillsDir: 'tool-specific' | 'shared'  // tool-specific = .claude/skills, shared = .agent/skills
  hideAfterOpen: boolean        // 打开 repo 后自动隐藏 Launcher
  alwaysOnTop: boolean          // 窗口置顶
  rememberWindowSize: boolean   // 记住窗口尺寸/位置
}
```

---

## Skills 文件系统

### Tool-Specific 模式（默认）
| AI 工具 | 技能目录 | 格式 |
|---|---|---|
| Claude | `.claude/skills/` | `.md` |
| Cursor | `.cursor/rules/` | `.mdc` |
| Windsurf | `.windsurf/rules/` | `.md` |
| Codex | `.codex/` | `.md` |
| Copilot | `.github/` | `.md` |

### Shared 模式
- 统一目录：`.agent/skills/`，所有工具共用

### 技能文件结构
- **平铺文件**：`.claude/skills/commit-msg.md`（单文件技能）
- **目录技能**（git clone 安装）：`.claude/skills/ui-ux-pro-max/SKILL.md`（含 data/、scripts/ 子目录）

### Instruction 文件
| AI 工具 | 文件路径 |
|---|---|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| Windsurf | `.windsurfrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |

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
| `auth:sign-in` / `auth:sign-out` / `auth:get-session` | Supabase OAuth |
| `license:get-status` / `license:verify` | License 状态 |
| `skills:scan-repo` / `skills:scan-all` | 扫描 repo 中的技能文件 |
| `skills:create` / `skills:update` / `skills:delete` / `skills:toggle` / `skills:globalize` | CRUD 技能文件 |
| `skills:presets:get` / `save` / `delete` / `apply` | 技能预设管理 |
| `skills:marketplace:search` | 搜索 marketplace 技能（支持分页/过滤/按 installs 排序） |
| `skills:marketplace:get` | 获取单个技能内容 |
| `skills:marketplace:install` | 安装技能（自动检测：全 slug → git clone，否则单文件） |
| `skills:marketplace:filter-stats` | 获取 tag/author 统计（调用 Supabase RPC） |
| `repo:last-commit` | 获取 repo 最后一次 commit（message + date） |
| `repo:language-stats` | 扫描 repo 语言分布（文件统计，无网络） |
| `instructions:scan` / `read` / `write` / `globalize` | Instruction 文件管理 |
| `shortcut:suspend` / `shortcut:resume` | 在设置页编辑热键时暂停/恢复快捷键监听 |

---

## 窗口配置

| 窗口 | 尺寸 | 特性 |
|---|---|---|
| Launcher | 680×480（可调，若 rememberWindowSize=true 则记住） | 无边框、透明、可置顶（alwaysOnTop=true）、失焦自动隐藏（suppressHide 机制保护 dialog） |
| Marketplace（legacy） | 1200×800 | 有边框、通过 hash `#view=marketplace` 打开 |

### suppressHide 机制（window.ts）
当打开原生 `dialog.showOpenDialog()` 时（添加 repo），失焦会触发 `hideLauncher()`，导致窗口关闭。
通过 `setSuppressHide(true/false)` 在 IPC handler 中包裹 dialog 调用，防止这种情况。

---

## License / Trial 系统

- **试用期**：7 天，从首次启动开始计时（`trialStartedAt` 存 electron-store）
- **License 验证**：调用 Supabase Edge Function `verify-license`，需要 Bearer token（登录后才验证）
- **缓存**：1 小时 TTL（`licenseCache` 存 electron-store）
- **状态**：`'licensed' | 'trial' | 'expired'`
- **UI 限制**：试用到期后显示 `NagScreen`（在 `LauncherView` 中）

---

## Marketplace 离线回退机制

当 Supabase 不可用时，`skills-marketplace.ts` 自动回退到 8 条内置技能（`BUNDLED_SKILLS`）：
- TypeScript Strict Mode
- React Best Practices
- Code Review Guidelines
- Python Conventions
- Git Commit Messages
- Security Checklist
- Testing Patterns
- REST API Design

**离线检测**：`MarketplaceEmbeddedView.tsx` 在 `total <= 8` 时显示黄色警告 banner，提示用户配置 Supabase。

---

## 爬虫系统（已迁移到 Supabase）

> ⚠️ 旧文档中的 `data/marketplace.db` 路径**已过时**。现在数据存在 Supabase PostgreSQL。

### npm run scrape（sitemap 爬虫）
```bash
SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/scrape-marketplace.ts
```
- 解析 `https://skills.sh/sitemap.xml`
- 获取约 4,000 条技能（含内容）
- 并发 5，批次间隔 200ms

### npm run scrape-all（API 爬虫）
```bash
SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/scrape-marketplace-api.ts
```
- 遍历字母/数字/关键词查询 `https://skills.sh/api/search`
- 获取约 17,000+ 条技能（仅元数据，不包含内容）
- 支持断点续传

> **注意**：爬虫脚本需要 `SUPABASE_SERVICE_ROLE_KEY` 环境变量（Service Role Key，不要提交到代码！）

---

## 已知问题与待解决事项

### 1. ⚠️ 登录失败（"Opening browser..." 卡住）
**根因**：Supabase Dashboard 未添加 localhost redirect URL
**修复**：Authentication → URL Configuration → 添加 `http://localhost:5723{5,6,7,8}/callback`

### 2. ⚠️ Marketplace 只显示 8 条（离线模式）
**根因**：anon 角色缺少 `GRANT SELECT` 权限
**修复**：SQL Editor 执行 `GRANT SELECT ON marketplace_skills TO anon;`（见上方完整 SQL）

### 3. Marketplace 内容覆盖不完整
- API 爬虫（17,000 条）只存元数据，不抓内容
- 只有 sitemap 爬虫获取的 ~4,000 条有 content
- **修复方向**：在 `npm run scrape-all` 后运行 `batchFetchSkillContent()`

### 4. skills.sh 覆盖率差距
- skills.sh 显示 71,667 个技能，目前只爬到 ~17,310（约 24%）
- **修复方向**：增加 3 字母前缀枚举或按 owner 枚举

### 5. 热键（已修复，2026-03-04）
- ~~快捷键无法打开 app~~
- **已修复**：`GeneralSettings.tsx` 中的正规化 bug（链式 `.replace()` 破坏 'CommandOrControl'）
- **已修复**：`index.ts` 中添加启动回退（存储的热键无效时自动重置为默认值）

---

## 最近提交（2026-03-04）

| Commit | 内容 |
|---|---|
| `840b33f` | fix: hotkey normalization corruption + startup fallback |
| `24d8866` | fix: add offline warning banner when Supabase marketplace is unreachable |
| `ae380ca` | fix: login state + dependency cleanup |
| `5018e52` | fix: resolve electron-builder 'not a file' CI error |
| `a3013a3` | fix: 3 UI bugs + CI build error + hotkey suspend on settings focus |
| `5bcfd6f` | fix: force PKCE flow on Supabase client |
| `27d64e7` | feat: switch OAuth to system browser + local HTTP server |

---

## Progress Against Final Goal

- [x] Spotlight 风格 Launcher（repo 搜索、打开编辑器）
- [x] 系统托盘 + 全局热键（Cmd+Shift+O）
- [x] Git 分支显示
- [x] Settings（编辑器、主题、热键、登录启动、alwaysOnTop、hideAfterOpen、rememberWindowSize）
- [x] Supabase OAuth 认证（PKCE + local HTTP server，RFC 8252）
- [x] License / Trial 系统（7 天试用 + Edge Function 验证）
- [x] Skills 管理（scan、create、edit、delete、toggle、globalize）
- [x] Skills 预设（保存/应用一组 skill）
- [x] Marketplace 嵌入主窗口（非独立窗口）
- [x] Marketplace 搜索/分页/过滤/按 installs 排序
- [x] Marketplace 离线回退（8 条 BUNDLED_SKILLS）+ 离线警告 banner
- [x] Skills 多文件安装（git clone，支持 SKILL.md + data/ + scripts/）
- [x] Instruction 文件管理（CLAUDE.md、.cursorrules 等）
- [x] Repo Info Tab（last commit + 语言分布条）
- [x] Tray 修复（macOS 左键=show，右键=menu）
- [x] Repo 卡片三点菜单（Remove）
- [x] 全局热键正规化 bug 修复
- [ ] **Supabase Dashboard 配置**（redirect URLs + GRANT — 需要手动操作）
- [ ] **Marketplace 爬虫运行**（需要 Service Role Key + npm run scrape-all）
- [ ] Marketplace 内容全覆盖（当前 ~4,000 有内容，其余仅元数据）
- [ ] 覆盖率提升（目前 ~17,310 / 71,667 = 24%）

---

## 开发工作流

```bash
# 启动开发模式
npm run dev

# 构建
npm run build

# 打包 macOS
npm run build:mac

# 爬取 marketplace 技能（需要 Service Role Key）
SUPABASE_SERVICE_ROLE_KEY=xxx npm run scrape
SUPABASE_SERVICE_ROLE_KEY=xxx npm run scrape-all
```

---

## 关键文件快速索引

| 需要改什么 | 看哪里 |
|---|---|
| 添加新 IPC 事件 | `shared/constants.ts` → `ipc-handlers.ts` → `preload/index.ts` |
| 修改 Marketplace 搜索逻辑 | `skills-supabase.ts` + `skills-marketplace.ts` |
| 修改爬虫策略 | `skills-scraper.ts`（sitemap）或 `skills-scraper-api.ts`（API） |
| 修改 Launcher UI | `components/Launcher/` |
| 修改 Marketplace UI | `components/Skills/MarketplaceEmbeddedView.tsx` |
| 修改 Skills 面板 | `components/Skills/SkillsPanel.tsx` |
| 修改 Settings | `components/Settings/` + `store.ts` |
| 修改认证流程 | `auth-service.ts` + `oauth-local-server.ts` |
| 修改窗口行为 | `window.ts`（含 suppressHide 机制） |
| 修改热键逻辑 | `shortcut.ts`（主进程）+ `GeneralSettings.tsx`（前端录制） |
| 修改 License/Trial | `license-service.ts` + `trial-service.ts` |
| Supabase 表结构 | 登录 Supabase Dashboard → SQL Editor |
