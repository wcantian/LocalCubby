# CODE-INDEX

> 每次修改/新增/删除代码文件后必须同步更新本表。

## 文档

| 路径 | 行数 | 说明 |
|---|---|---|
| `README.md` | 112 | GitHub 项目主页：功能、5 张真实运行截图、快速开始、数据格式、开发命令、限制与文档索引 |
| `PRD.md` | 122 | 产品需求文档，需求唯一权威来源（数据模型、FR-1~FR-9、V1 排除项、验收标准）。**仅本地维护，不上传** |
| `AGENTS.md` | 51 | 项目指引：技术栈、目录结构、关键设计决策、强制开发规范。**仅本地维护，不上传** |
| `CODE-INDEX.md` | - | 本文件，代码索引 |
| `todo-list/README.md` | 34 | 任务清单（V1 分四阶段登记，V2 候选）。**仅本地维护，不上传** |
| `dev-log/` | - | 开发日志，按 `YYYY-MM-DD.md` 归档。**仅本地维护，不上传** |

## 设计稿

| 路径 | 行数 | 说明 |
|---|---|---|
| `design/index.html` | 1246 | 静态设计稿 V1，单文件无依赖。含设计变量、根页面、标签页、类型页、搜索态、右键菜单、添加弹窗、空状态与失效态共 8 个画面 |

## 工程配置

| 路径 | 行数 | 说明 |
|---|---|---|
| `package.json` | 45 | 依赖与脚本：`dev` / `build` / `typecheck` / `pack` / `smoke`；electron-builder 配置（免安装 dir 目标，输出 `release/`） |
| `electron.vite.config.ts` | 20 | electron-vite 三段构建配置（main/preload/renderer + React 插件） |
| `tsconfig.json` | 7 | 引用式根配置 |
| `tsconfig.node.json` | 19 | 主进程/preload/shared 的 TS 配置（Node + DOM lib） |
| `tsconfig.web.json` | 19 | 渲染进程 TS 配置（react-jsx + DOM lib） |
| `.gitignore` | 13 | 忽略 node_modules / out / release / data / tmp-smoke / tmp-shot / tsbuildinfo，以及内部文档（PRD、AGENTS、todo-list、dev-log） |

## 主进程

| 路径 | 行数 | 说明 |
|---|---|---|
| `src/main/index.ts` | 104 | 窗口创建（1000×700、位置尺寸持久化、关闭即退出）、便携数据目录判定（`app.isPackaged` 分支）、IPC 注册：`library:read/write`、`item:open`（本地走 openPath、link 走 openExternal）、`item:reveal`、`dialog:pick`、`path:probe`、`path:exists-many`、窗口 focus 事件转发 |
| `src/main/store.ts` | 49 | JSON 读写层：原子写入（`.tmp` + rename）、损坏文件改名备份（`.corrupt-<ts>`）、`library.json` 与 `window-state.json` 读写 |

## preload

| 路径 | 行数 | 说明 |
|---|---|---|
| `src/preload/index.ts` | 21 | contextBridge 暴露最小 API；`webUtils.getPathForFile` 取拖拽文件真实路径 |

## 渲染进程

| 路径 | 行数 | 说明 |
|---|---|---|
| `src/renderer/index.html` | 15 | 页面入口与 CSP（放行 dev 内联脚本与 HMR 连接） |
| `src/renderer/src/main.tsx` | 12 | React 挂载，外层包 `I18nProvider` |
| `src/renderer/src/App.tsx` | 271 | 应用主状态：视图路由（root/type/tag/uncat）、搜索、排序、语言切换、失效检测、拖拽入窗、右键菜单与弹窗编排、增删改持久化 |
| `src/renderer/src/i18n.tsx` | 157 | 中英双语文案与 `I18nProvider`/`useI18n`：默认跟随系统语言、切换持久化 `localStorage`、`{n}` 参数插值、`TYPE_KEY` 类型名映射 |
| `src/renderer/src/styles.css` | 525 | 全部样式，沿用设计稿的设计变量与组件样式 |
| `src/renderer/src/utils.ts` | 71 | 类型推断、标题推导、URL 规范化、中文拼音排序、搜索匹配 |
| `src/renderer/src/global.d.ts` | 17 | 声明 `window.api` 接口类型（不引入 electron 类型到 web 项目） |
| `src/renderer/src/components/RootView.tsx` | 88 | 根页面：类型四卡片 + 标签卡片 + 未分类 + 空库引导 |
| `src/renderer/src/components/ItemGrid.tsx` | 39 | 条目网格与条目卡片（四类图标、标题、说明、失效态） |
| `src/renderer/src/components/ItemModal.tsx` | 190 | 添加/编辑弹窗：路径/网址、标题、说明、类型分段、标签 chip 与自动补全、浏览与选目录 |
| `src/renderer/src/components/ContextMenu.tsx` | 66 | 右键菜单：打开、打开所在目录（link 不显示）、编辑、删除；边界翻转与外部点击关闭 |
| `src/renderer/src/components/Icons.tsx` | 175 | SVG symbol 定义与 `Icon` 组件（四类类型图标 + 通用小图标） |

## 共享与脚本

| 路径 | 行数 | 说明 |
|---|---|---|
| `src/shared/types.ts` | 30 | 主进程与渲染进程共享类型：`Item`、`LibraryFile`、`ProbeResult`、`WindowState`（类型显示名在 i18n 提供） |
| `scripts/smoke.mjs` | 291 | 冒烟测试：写入测试数据 → 启动打包 exe（CDP 调试端口）→ 固定中文界面 → DOM 断言 18 项（含中英切换）→ 清理 |
| `scripts/screenshots.mjs` | 265 | 截图脚本：启动真实 exe、固定中文界面，通过 CDP 切换 5 个界面状态截图到 `docs/screenshots/` |

## 配图

| 路径 | 说明 |
|---|---|
| `docs/screenshots/01-home.png` | 根页面：类型四卡片 + 标签卡片 |
| `docs/screenshots/02-tag-group.png` | 标签分组页（项目A） |
| `docs/screenshots/03-context-menu.png` | 右键菜单展开态 |
| `docs/screenshots/04-search.png` | 搜索结果态 |
| `docs/screenshots/05-add-modal.png` | 添加条目弹窗 |

## 构建产物（不进版本库）

| 路径 | 说明 |
|---|---|
| `out/` | electron-vite 构建输出（main/preload/renderer） |
| `release/win-unpacked/` | 免安装应用目录，`LocalCubby.exe` 在此；运行时数据在 `data/library.json` |
