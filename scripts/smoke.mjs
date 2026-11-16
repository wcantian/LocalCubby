/**
 * LocalCubby 冒烟测试
 *
 * 做法：写入测试数据 → 启动打包后的 exe（带 --remote-debugging-port）→
 * 通过 CDP 在真实渲染进程里执行 DOM 断言 → 关闭进程并清理。
 *
 * 用法：node scripts/smoke.mjs [应用目录，默认 release/win-unpacked]
 */
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const PORT = 9333
const appDir = resolve(process.argv[2] ?? 'release/win-unpacked')
const exePath = join(appDir, 'LocalCubby.exe')
const tempRoot = resolve('tmp-smoke')

if (!existsSync(exePath)) {
  console.error(`找不到可执行文件：${exePath}\n请先执行 npm run pack`)
  process.exit(1)
}

// ---------- 准备测试文件与数据 ----------
rmSync(tempRoot, { recursive: true, force: true })
const dirs = ['示例程序', '项目A/bin', '项目A/docs', '协议文件']
for (const dir of dirs) mkdirSync(join(tempRoot, dir), { recursive: true })
writeFileSync(join(tempRoot, '示例程序/启动.bat'), '@echo off\r\n', 'utf8')
writeFileSync(join(tempRoot, '项目A/bin/测试工具.exe'), 'placeholder', 'utf8')
writeFileSync(join(tempRoot, '项目A/docs/项目A设计.md'), '# 设计\r\n', 'utf8')
// 故意不创建「文档1.txt」，用于验证失效检测

const items = [
  {
    id: 'a1',
    title: '测试工具.exe',
    desc: '项目A 串口压测工具',
    path: join(tempRoot, '项目A/bin/测试工具.exe'),
    type: 'program',
    tags: ['项目A', '测试工具'],
    createdAt: 1000
  },
  {
    id: 'a2',
    title: '启动.bat',
    desc: '示例程序快速启动',
    path: join(tempRoot, '示例程序/启动.bat'),
    type: 'program',
    tags: ['测试工具'],
    createdAt: 2000
  },
  {
    id: 'a3',
    title: '项目A设计.md',
    desc: '接口与流程设计说明',
    path: join(tempRoot, '项目A/docs/项目A设计.md'),
    type: 'doc',
    tags: ['项目A'],
    createdAt: 3000
  },
  {
    id: 'a4',
    title: '文档1.txt',
    desc: '协议摘录',
    path: join(tempRoot, '示例文档/文档1.txt'),
    type: 'doc',
    tags: [],
    createdAt: 4000
  },
  {
    id: 'a5',
    title: '协议文件',
    desc: '协议资料目录',
    path: join(tempRoot, '协议文件'),
    type: 'folder',
    tags: ['协议文档'],
    createdAt: 5000
  },
  {
    id: 'a6',
    title: '设备管理',
    desc: '192.168.0.104 后台',
    path: 'http://192.168.0.104',
    type: 'link',
    tags: ['项目A', '设备调试'],
    createdAt: 6000
  }
]

const dataDir = join(appDir, 'data')
mkdirSync(dataDir, { recursive: true })
writeFileSync(join(dataDir, 'library.json'), JSON.stringify({ version: 1, items }, null, 2), 'utf8')

// ---------- 启动应用 ----------
const child = spawn(exePath, [`--remote-debugging-port=${PORT}`], {
  cwd: appDir,
  stdio: 'ignore',
  env: { ...process.env, PYTHONPATH: '' }
})

let ws = null
let messageId = 0
const pending = new Map()

function send(method, params = {}) {
  return new Promise((resolvePromise, reject) => {
    const id = ++messageId
    pending.set(id, { resolvePromise, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? '页面脚本异常')
  }
  return result.result.value
}

async function waitForPage() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const targets = await response.json()
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
      if (page) return page.webSocketDebuggerUrl
    } catch {
      // 应用还在启动
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('等待调试端口超时')
}

async function connect(url) {
  ws = new WebSocket(url)
  await new Promise((resolvePromise, reject) => {
    ws.addEventListener('open', resolvePromise, { once: true })
    ws.addEventListener('error', () => reject(new Error('CDP 连接失败')), { once: true })
  })
  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data)
    if (!data.id) return
    const entry = pending.get(data.id)
    if (!entry) return
    pending.delete(data.id)
    if (data.error) entry.reject(new Error(data.error.message))
    else entry.resolvePromise(data.result)
  })
}

// ---------- 页面内工具函数 ----------
const HELPERS = `
  window.__setSearch = (value) => {
    const input = document.querySelector('.searchbox input')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
  window.__snap = () => ({
    typeCards: [...document.querySelectorAll('.type-card .name')].map((el) => el.textContent),
    typeNums: [...document.querySelectorAll('.type-card .num')].map((el) => el.textContent),
    tagCards: [...document.querySelectorAll('.tag-card .tname')].map((el) => el.textContent),
    titles: [...document.querySelectorAll('.item .title')].map((el) => el.textContent),
    missingTitles: [...document.querySelectorAll('.item.missing .title')].map((el) => el.textContent),
    resultCount: document.querySelector('.group-head .count')?.textContent ?? ''
  })
  true
`

const failures = []
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) {
    console.log(`      期望: ${JSON.stringify(expected)}`)
    console.log(`      实际: ${JSON.stringify(actual)}`)
    failures.push(name)
  }
}

try {
  const wsUrl = await waitForPage()
  await connect(wsUrl)

  // 等 React 挂载
  for (let attempt = 0; attempt < 40; attempt++) {
    const ready = await evaluate(`Boolean(document.querySelector('.toolbar') && document.querySelector('.type-card'))`)
    if (ready) break
    await new Promise((r) => setTimeout(r, 250))
  }
  await evaluate(HELPERS)

  const root = await evaluate('window.__snap()')
  check('根页面类型卡片', root.typeCards, ['程序', '文档', '文件夹', '网络连接'])
  check('根页面类型计数', root.typeNums, ['2 项', '2 项', '1 项', '1 项'])
  // 拼音序：ce < she < xiang < xie
  check('根页面标签卡片', root.tagCards, ['测试工具', '设备调试', '项目A', '协议文档', '未分类'])

  // 进入「文档」分组，验证失效检测
  await evaluate(`document.querySelectorAll('.type-card')[1].click(); true`)
  await new Promise((r) => setTimeout(r, 700))
  const docGroup = await evaluate('window.__snap()')
  check('文档分组条目', docGroup.titles, ['项目A设计.md', '文档1.txt'])
  check('失效条目灰化标记', docGroup.missingTitles, ['文档1.txt'])

  // 返回根页面
  await evaluate(`document.querySelector('.back').click(); true`)
  await new Promise((r) => setTimeout(r, 400))
  const backRoot = await evaluate('window.__snap()')
  check('返回根页面', backRoot.typeCards.length, 4)

  // 搜索「项目A」：命中 2 条标签 + 1 条标题
  await evaluate(`window.__setSearch('项目A'); true`)
  await new Promise((r) => setTimeout(r, 400))
  const searched = await evaluate('window.__snap()')
  check('搜索命中标题', searched.titles, ['测试工具.exe', '项目A设计.md', '设备管理'])

  // 搜索路径片段
  await evaluate(`window.__setSearch('示例程序'); true`)
  await new Promise((r) => setTimeout(r, 400))
  const byPath = await evaluate('window.__snap()')
  check('搜索命中路径', byPath.titles, ['启动.bat'])

  // 清空搜索
  await evaluate(`window.__setSearch(''); true`)
  await new Promise((r) => setTimeout(r, 400))
  const cleared = await evaluate('window.__snap()')
  check('清空搜索回到卡片', cleared.typeCards.length, 4)

  // 打开添加弹窗并检查类型推断
  await evaluate(`document.querySelectorAll('.toolbar .btn')[1].click(); true`)
  await new Promise((r) => setTimeout(r, 400))
  const modalTitle = await evaluate(`document.querySelector('.modal-head h2')?.textContent ?? ''`)
  check('添加弹窗打开', modalTitle, '添加条目')

  // 切到「网络连接」类型，浏览按钮应隐藏
  await evaluate(`document.querySelectorAll('.seg .opt')[3].click(); true`)
  await new Promise((r) => setTimeout(r, 300))
  const browseVisible = await evaluate(`Boolean(document.querySelector('.modal .row .btn'))`)
  check('网址类型隐藏浏览按钮', browseVisible, false)

  // 填网址与标题并保存
  await evaluate(`
    (() => {
      const inputs = document.querySelectorAll('.modal .input')
      const setV = (el, v) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(el, v)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      setV(inputs[0], 'example.com')
      setV(inputs[1], '示例网址')
      return true
    })()
  `)
  await new Promise((r) => setTimeout(r, 300))
  await evaluate(`[...document.querySelectorAll('.modal-foot .btn')].pop().click(); true`)
  await new Promise((r) => setTimeout(r, 800))

  const afterSave = await evaluate('window.__snap()')
  check('新增后网络连接计数', afterSave.typeNums, ['2 项', '2 项', '1 项', '2 项'])

  const saved = JSON.parse(
    execFileSync('node', ['-e', `process.stdout.write(require('fs').readFileSync(${JSON.stringify(join(dataDir, 'library.json'))}, 'utf8'))`], {
      encoding: 'utf8'
    })
  )
  const linkItem = saved.items.find((item) => item.title === '示例网址')
  check('新增条目已落盘', Boolean(linkItem), true)
  check('网址自动补协议', linkItem?.path, 'https://example.com')
} catch (error) {
  console.error('冒烟测试异常：', error.message)
  failures.push('运行异常')
} finally {
  try {
    if (child.pid) {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    }
  } catch {
    // 进程可能已退出
  }
  ws?.close()
  rmSync(tempRoot, { recursive: true, force: true })
}

console.log('')
if (failures.length === 0) {
  console.log('冒烟测试全部通过')
  process.exit(0)
} else {
  console.log(`冒烟测试失败 ${failures.length} 项：${failures.join('、')}`)
  process.exit(1)
}
