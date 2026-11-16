# CODE-INDEX

> 每次修改/新增/删除代码文件后必须同步更新本表。

## 文档

| 路径 | 行数 | 说明 |
|---|---|---|
| `PRD.md` | 105 | 产品需求文档，需求唯一权威来源（数据模型、FR-1~FR-8、V1 排除项、验收标准） |
| `AGENTS.md` | 48 | 项目指引：技术栈、目录结构、关键设计决策、强制开发规范 |
| `CODE-INDEX.md` | - | 本文件，代码索引 |
| `todo-list/README.md` | 31 | 任务清单（V1 分四阶段登记，V2 候选） |
| `dev-log/` | - | 开发日志，按 `YYYY-MM-DD.md` 归档 |

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
| `.gitignore` | 7 | 忽略 node_modules / out / release / data / tmp-smoke / tsbuildinfo |

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
| `src/renderer/src/main.tsx` | 9 | React 挂载 |
| `src/renderer/src/App.tsx` | 255 | 应用主状态：视图路由（root/type/tag/uncat）、搜索、排序、失效检测、拖拽入窗、右键菜单与弹窗编排、增删改持久化 |
| `src/renderer/src/styles.css` | 525 | 全部样式，沿用设计稿的设计变量与组件样式 |
| `src/renderer/src/utils.ts` | 71 | 类型推断、标题推导、URL 规范化、中文拼音排序、搜索匹配 |
| `src/renderer/src/global.d.ts` | 17 | 声明 `window.api` 接口类型（不引入 electron 类型到 web 项目） |
| `src/renderer/src/components/RootView.tsx` | 87 | 根页面：类型四卡片 + 标签卡片 + 未分类 + 空库引导 |
| `src/renderer/src/components/ItemGrid.tsx` | 36 | 条目网格与条目卡片（四类图标、标题、说明、失效态） |
| `src/renderer/src/components/ItemModal.tsx` | 189 | 添加/编辑弹窗：路径/网址、标题、说明、类型分段、标签 chip 与自动补全、浏览与选目录 |
| `src/renderer/src/components/ContextMenu.tsx` | 64 | 右键菜单：打开、打开所在目录（link 不显示）、编辑、删除；边界翻转与外部点击关闭 |
| `src/renderer/src/components/Icons.tsx` | 175 | SVG symbol 定义与 `Icon` 组件（四类类型图标 + 通用小图标） |

## 共享与脚本

| 路径 | 行数 | 说明 |
|---|---|---|
| `src/shared/types.ts` | 36 | 主进程与渲染进程共享类型：`Item`、`LibraryFile`、`ProbeResult`、`WindowState`、`TYPE_LABEL` |
| `scripts/smoke.mjs` | 271 | 冒烟测试：写入测试数据 → 启动打包 exe（CDP 调试端口）→ DOM 断言 13 项 → 清理 |

## 构建产物（不进版本库）

| 路径 | 说明 |
|---|---|
| `out/` | electron-vite 构建输出（main/preload/renderer） |
| `release/win-unpacked/` | 免安装应用目录，`LocalCubby.exe` 在此；运行时数据在 `data/library.json` |
