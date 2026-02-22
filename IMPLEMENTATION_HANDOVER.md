# Implementation Handover: Batch Scraper with SQLite Database

## 实施日期
2026-02-22

## 概述
将 marketplace 技能爬虫从 JSON 缓存文件架构迁移到 SQLite 数据库架构。现在爬虫会批量抓取所有 skills.sh 技能并将完整内容存储在本地数据库中，而非实时获取。

## 已完成的工作

### 1. 依赖包安装
✅ 添加到 `package.json`:
- `better-sqlite3: ^12.6.2` - 嵌入式 SQLite 数据库
- `@types/better-sqlite3: ^7.6.11` - TypeScript 类型定义
- `tsx: ^4.7.0` - TypeScript 执行器（用于 CLI 工具）
- 添加 npm 脚本: `"scrape": "tsx scripts/scrape-marketplace.ts"`

### 2. 数据库模块 (`src/main/skills-db.ts`) ✅
创建了完整的 SQLite 数据库层：

**数据库结构:**
```sql
-- skills 表：存储技能元数据和内容
CREATE TABLE skills (
  slug TEXT PRIMARY KEY,          -- 唯一标识符 "owner/repo/skillId"
  owner TEXT NOT NULL,             -- GitHub owner
  repo TEXT NOT NULL,              -- GitHub repo
  skillId TEXT NOT NULL,           -- 技能 ID
  name TEXT NOT NULL,              -- 技能名称
  content TEXT,                    -- 完整的 SKILL.md 内容
  contentFetchedAt TEXT,           -- 内容获取时间
  contentError TEXT,               -- 获取失败的错误信息
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化查询性能
CREATE INDEX idx_skills_owner ON skills(owner);
CREATE INDEX idx_skills_repo ON skills(repo);
CREATE INDEX idx_skills_name ON skills(name);

-- metadata 表：存储爬虫元数据
CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**CRUD 操作:**
- `upsertSkill()` - 插入或更新技能元数据
- `updateSkillContent()` - 更新技能内容
- `getSkillBySlug()` - 按 slug 获取单个技能
- `getAllSkills()` - 获取所有技能
- `getSkillsWithoutContent()` - 获取未抓取内容的技能
- `searchSkills()` - 分页搜索（支持 query、tag、author 过滤）
- `getFilterStats()` - 获取过滤统计（tag 和 author 计数）
- `setMetadata()` / `getMetadata()` - 元数据操作

**特性:**
- WAL 模式 (`journal_mode = WAL`) 提升并发性能
- 自动初始化数据库 schema
- 连接管理 (`getDb()`, `closeDb()`)

### 3. 爬虫模块更新 (`src/main/skills-scraper.ts`) ✅

**移除:**
- ❌ `getSkillsCache()` - 不再使用 JSON 缓存
- ❌ `SkillsCache` 接口 - 已替换为数据库
- ❌ RSC payload 提取代码（`parseRSCPayload`, `decodeRSCHtml`, `extractSkillContentFromHtml`）
- ❌ `decodeHtmlEntities` 函数

**新增/更新:**
- ✅ `scrapeSkillsToDb()` - 爬取 sitemap 并写入数据库
- ✅ `batchFetchSkillContent()` - 批量获取技能内容
  - 5 并发请求
  - 每批次间隔 200ms
  - 数据库自动提交（可恢复）
  - 预计 ~3-4 分钟完成 ~1000 个技能
- ✅ `fetchSkillContent()` - 改进的内容提取策略
  - **策略 1**: 优先尝试 GitHub raw URLs（最可靠）
  - **策略 2**: 从 skills.sh HTML 提取（查找 prose wrapper，转换为 markdown）
  - **策略 3**: 返回占位符
  - 使用 turndown 库将 HTML 转 Markdown

### 4. Marketplace API 更新 (`src/main/skills-marketplace.ts`) ✅

**替换操作:**
- ❌ `getSkillsCache()` → ✅ 使用 `searchSkills()` 从数据库查询
- ❌ 手动过滤和分页 → ✅ 数据库内置分页和过滤
- ❌ 手动统计 tags/authors → ✅ 数据库 SQL 聚合查询

**函数更新:**
- `searchMarketplaceSkills()` - 使用数据库分页搜索
- `getMarketplaceFilterStats()` - 使用数据库聚合查询
- `getMarketplaceSkillContent()` - 从数据库读取内容
  - 如果内容存在 → 返回内容
  - 如果未抓取 → 提示运行爬虫
  - 如果抓取失败 → 显示错误信息
- `getMarketplaceCacheStatus()` - 新增，读取爬虫元数据
- `skillRowToMarketplaceSkill()` - 数据库行转 MarketplaceSkill 对象

### 5. CLI 爬虫工具 (`scripts/scrape-marketplace.ts`) ✅

创建开发者命令行工具用于批量爬取：

```bash
npm run scrape
```

**功能:**
- Mock Electron `app` 模块（因为在 Node.js 环境运行）
- 步骤 1: 爬取 sitemap，插入数据库
- 步骤 2: 批量获取所有技能内容
- 进度输出（每 10 个技能）
- 完成统计（成功/失败数量）
- 自动关闭数据库连接
- 错误处理和退出码

**输出示例:**
```
Step 1/2: Scraping skill index from skills.sh...
  Fetching sitemap... (0/1)
  Parsing skills... (1/1)
Found 1234 skills

Step 2/2: Fetching content for all skills...
  Fetched 10/1234: vercel-labs/skills/find-skills
  Fetched 20/1234: anthropics/agent-skills/commit-msg
  ...

✓ Complete!
  1200 skills fetched successfully
  34 skills failed
```

### 6. 构建和测试 ✅
- ✅ TypeScript 编译成功
- ✅ 依赖包安装成功（`better-sqlite3@12.6.2` 与 Electron 40 兼容）
- ✅ `npm run build` 成功

### 7. 修复和改进 ✅
实施过程中发现并修复的问题：

**问题 1: 数据库目录不存在**
- 错误: `Cannot open database because the directory does not exist`
- 修复: 在 `skills-db.ts` 的 `getDb()` 中添加目录创建逻辑
- 代码: 使用 `fs.mkdirSync(dbDir, { recursive: true })` 确保父目录存在

**问题 2: Native Module 版本不兼容**
- 错误: `better-sqlite3` 在 Electron 和 Node.js 之间的 MODULE_VERSION 不匹配
- Electron 使用 MODULE_VERSION 143 (Node.js v22.x)
- CLI 脚本 (tsx) 使用 MODULE_VERSION 131 (系统 Node.js)
- 修复: 更新 `npm run scrape` 脚本，自动处理编译:
  ```json
  "scrape": "npm rebuild better-sqlite3 && tsx scripts/scrape-marketplace.ts && npx electron-rebuild -f -w better-sqlite3"
  ```
  - 先为系统 Node.js 重新编译
  - 运行爬虫脚本
  - 再为 Electron 重新编译

## 未完成的工作

### 需要完成的任务:

1. **运行爬虫填充数据库** ✅
   ```bash
   npm run scrape
   ```
   - ✅ 已完成 - 数据库已创建并填充
   - ✅ 位置: `~/Library/Application Support/desktop-tool/marketplace.db`
   - ✅ 4001 技能已爬取，全部包含内容
   - ℹ️ 注意: `npm run scrape` 脚本会自动处理 better-sqlite3 的编译问题（先为 Node.js 编译，运行后再为 Electron 重新编译）

2. **UI 测试** ⚠️
   - 启动应用: `npm run dev`
   - 打开 Marketplace 窗口
   - 验证:
     - 技能列表正确显示
     - 搜索和过滤功能正常
     - 点击技能显示完整内容（不是 `npx skills find [query]`）
     - 分页功能正常（每页 24 个）
     - 过滤 pills 显示正确的计数

3. **边缘情况测试** ⚠️
   - 查看抓取失败的技能 → 应显示错误信息
   - 查看未抓取的技能 → 应提示运行爬虫
   - 数据库为空时 → 应回退到 bundled skills

4. **数据库验证** ⚠️
   ```bash
   sqlite3 ~/Library/Application\ Support/desktop-tool/marketplace.db

   # 检查技能数量
   SELECT COUNT(*) FROM skills;

   # 检查示例技能
   SELECT slug, name, length(content) as content_length
   FROM skills
   WHERE slug = 'vercel-labs/skills/find-skills';

   # 检查元数据
   SELECT * FROM metadata;

   # 检查失败的技能
   SELECT slug, contentError FROM skills WHERE contentError IS NOT NULL;
   ```

5. **IPC Handlers 更新** ⚠️ (可能需要)
   检查 `src/main/ipc-handlers.ts` 是否需要更新以调用新的数据库函数。
   特别是与 marketplace cache status 相关的 handlers。

## 数据库位置

- **macOS**: `~/Library/Application Support/desktop-tool/marketplace.db`
- **Windows**: `%APPDATA%/desktop-tool/marketplace.db`
- **Linux**: `~/.config/desktop-tool/marketplace.db`

## 架构变更总结

### 之前 (JSON Cache):
```
UI → IPC → skills-marketplace.ts → getSkillsCache() → JSON file
                                  → fetchSkillContent() → skills.sh (on-demand)
```

### 现在 (SQLite Database):
```
UI → IPC → skills-marketplace.ts → searchSkills() → SQLite DB
                                  → getSkillBySlug() → SQLite DB

Developer → npm run scrape → scrapeSkillsToDb() → SQLite DB
                           → batchFetchSkillContent() → SQLite DB
```

## 优势

1. **性能**: 数据库索引查询 > JSON 文件遍历
2. **可靠性**: 批量爬取 > 实时获取（避免网络延迟）
3. **完整性**: 预先抓取完整内容 > 首次查看时抓取
4. **可恢复**: 数据库自动提交 > JSON 文件全量写入
5. **可扩展**: SQL 查询 > JavaScript 过滤

## 技术债务

- ✅ 移除了未使用的 RSC 相关代码
- ✅ 清理了 turndown 相关辅助函数
- ⚠️ bundled skills 作为 fallback 仍然存在（可能未来移除）

## 下一步建议

1. 运行 `npm run scrape` 填充数据库
2. 测试 UI 功能
3. 验证数据库内容正确
4. 考虑添加数据库迁移机制（如果 schema 需要更新）
5. 考虑添加增量更新机制（只抓取新增/更新的技能）
6. 监控数据库文件大小（~1000 技能预计几 MB）

## 相关文件

**新增:**
- `src/main/skills-db.ts` - 数据库层
- `scripts/scrape-marketplace.ts` - CLI 爬虫工具

**修改:**
- `package.json` - 依赖和脚本
- `src/main/skills-scraper.ts` - 使用数据库
- `src/main/skills-marketplace.ts` - 使用数据库 API

**计划修改但需检查:**
- `src/main/ipc-handlers.ts` - IPC handlers
- `src/preload/index.ts` - Preload API
- UI 组件（如果需要）

## 构建命令

```bash
# 安装依赖
npm install

# 运行爬虫（首次/更新数据库）
npm run scrape

# 开发模式
npm run dev

# 生产构建
npm run build

# 构建应用（macOS）
npm run build:mac
```

---

**实施者**: Claude Sonnet 4.5
**计划文档**: `/Users/shuo.yin/.claude/plans/distributed-sprouting-sloth.md`
**实施日期**: 2026-02-22
