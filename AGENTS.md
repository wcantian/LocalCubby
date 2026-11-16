# AGENTS.md — LocalCubby 项目指引

本文件供 AI 编码代理及新加入的开发者阅读，说明项目定位、结构约定与强制规范。

## 项目概述

**LocalCubby**：本地个人工具箱。收录本机常用程序、文档、文件夹为条目，提供类 Windows 桌面图标的网格界面，双击直接打开目标。产品需求见 `PRD.md`（唯一权威需求来源，改动需求先改 PRD）。

## 技术栈

- Electron + React + TypeScript
- 数据：单 JSON 文件（`data/library.json`），原子写入（先写 `.tmp` 再 rename）
- 打包：electron-builder 免安装目录，不做 NSIS 安装包

## 计划目录结构

```
LocalCubby/
├─ PRD.md              # 产品需求（权威）
├─ AGENTS.md           # 本文件
├─ CODE-INDEX.md       # 代码索引（强制维护，见下）
├─ todo-list/README.md # 大功能任务登记
├─ dev-log/            # 开发日志，YYYY-MM-DD.md
├─ src/
│  ├─ main/            # Electron 主进程（窗口、IPC、数据读写、openPath）
│  ├─ preload/         # contextBridge 暴露的安全 API
│  └─ renderer/        # React 界面
└─ data/               # 运行时数据（library.json），不进 git
```

## 常用命令

```powershell
npm install          # 安装依赖
npm run dev          # 开发模式（热更新）
npm run build        # 打包免安装目录（release/win-unpacked）
```

## 关键设计决策（勿违背）

1. **双击打开通道**：本地路径统一走 `shell.openPath`，网址（`type: 'link'`）走 `shell.openExternal`；不引入工作目录/启动参数/管理员权限配置。
2. **类型固定四类**（program/doc/folder/link，link = 网络连接），标签为自由文本多值，无独立标签管理页，标签列表从条目派生。
3. **不提取图标**，用内置矢量图标 + 标题首字色块。
4. **数据原子写入**，任何写库操作都必须走同一入口。
5. **失效路径只灰化不自动删除**；网址条目不参与失效检测。
6. 排序用 `localeCompare(x, 'zh-CN')` 实现中文拼音序，**不引入拼音库**。
7. 主进程与渲染进程隔离：渲染进程不得直接使用 Node API，一律通过 preload 暴露的最小 IPC 接口。

## V1 明确不做（勿擅自添加）

拼音首字母搜索、搜索历史/高亮、多标签交集筛选、深色模式、批量删除、导入导出 UI、工作目录/启动参数、托盘/全局热键/开机自启（V2 候选）。

## 开发规范（强制）

1. 每次修改/新增/删除代码文件后，**同步更新 `CODE-INDEX.md`**（路径、行数、功能说明）。
2. 大功能或大代码变动**开始前**，先在 `todo-list/README.md` 登记任务（`[ ]` 标记，拆分子任务）。
3. 大功能完成后，在 `dev-log/YYYY-MM-DD.md` 记录开发日志（变更文件清单、步骤、问题与修复、构建结果、下一步）。
4. 小修小补不写 todo/dev-log，但 CODE-INDEX 仍需更新。

## 其他约定

- 所有交流、注释、文档、commit message **优先中文**；中文 commit 用 `git commit -F <UTF-8 文件>` 方式，避免 `-m "中文"` 在 Windows 下乱码。
- 文件编码 UTF-8（无 BOM）。
- 修复问题必须从根源修，禁止加兜底/防御性补丁掩盖设计缺陷；每个修复要能回答「根源是什么、为什么这个改动消除根源」。
- 极简优先：不加 PRD 未要求的功能；改动每行都要能追溯到 PRD 或用户的明确需求。
