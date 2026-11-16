/**
 * LocalCubby 截图脚本（用于 README）
 *
 * 做法：写入演示数据 → 启动打包后的 exe（带调试端口）→ 通过 CDP
 * 依次切换界面状态并用 Page.captureScreenshot 截图 → 关闭进程并清理。
 *
 * 用法：node scripts/screenshots.mjs [应用目录，默认 release/win-unpacked]
 * 输出：docs/screenshots/*.png
 */
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const PORT = 9334
const appDir = resolve(process.argv[2] ?? 'release/win-unpacked')
const exePath = join(appDir, 'LocalCubby.exe')
const tempRoot = resolve('tmp-shot')
const outDir = resolve('docs/screenshots')

if (!existsSync(exePath)) {
  console.error(`找不到可执行文件：${exePath}\n请先执行 npm run pack`)
  process.exit(1)
}

// ---------- 演示数据：文件真实存在，避免出现「路径不存在」 ----------
rmSync(tempRoot, { recursive: true, force: true })
for (const dir of ['示例程序', '项目A/bin', '项目A/docs', '项目B', '协议文件']) {
  mkdirSync(join(tempRoot, dir), { recursive: true })
}
writeFileSync(join(tempRoot, '示例程序/启动.bat'), '@echo off\r\n', 'utf8')
writeFileSync(join(tempRoot, '项目A/bin/测试工具.exe'), 'placeholder', 'utf8')
writeFileSync(join(tempRoot, '项目A/docs/项目A设计.md'), '# 设计\r\n', 'utf8')
writeFileSync(join(tempRoot, '项目B/项目B.bat'), '@echo off\r\n', 'utf8')
writeFileSync(join(tempRoot, '示例文档1.txt'), '协议摘录\r\n', 'utf8')

const items = [
  {
    id: 's1',
    title: '测试工具.exe',
    desc: '项目A 串口压测工具',
    path: join(tempRoot, '项目A/bin/测试工具.exe'),
    type: 'program',
    tags: ['项目A', '测试工具'],
    createdAt: 1000
  },
  {
    id: 's2',
    title: '项目A设计.md',
    desc: '接口与流程设计说明',
    path: join(tempRoot, '项目A/docs/项目A设计.md'),
    type: 'doc',
    tags: ['项目A'],
    createdAt: 2000
  },
  {
    id: 's3',
    title: '设备管理',
    desc: '192.168.0.104 后台',
    path: 'http://192.168.0.104',
    type: 'link',
    tags: ['项目A', '设备调试'],
    createdAt: 3000
  },
  {
    id: 's4',
    title: '启动.bat',
    desc: '示例程序快速启动',
    path: join(tempRoot, '示例程序/启动.bat'),
    type: 'program',
    tags: ['测试工具'],
    createdAt: 4000
  },
  {
    id: 's5',
    title: '项目B.bat',
    desc: '项目B 一键启动',
    path: join(tempRoot, '项目B/项目B.bat'),
    type: 'program',
    tags: ['项目B'],
    createdAt: 5000
  },
  {
    id: 's6',
    title: '文档1.txt',
    desc: '协议摘录笔记',
    path: join(tempRoot, '示例文档1.txt'),
    type: 'doc',
    tags: [],
    createdAt: 6000
  },
  {
    id: 's7',
    title: '协议文件',
    desc: '协议资料与抓包记录',
    path: join(tempRoot, '协议文件'),
    type: 'folder',
    tags: ['协议文档'],
    createdAt: 7000
  }
]

const dataDir = join(appDir, 'data')
mkdirSync(dataDir, { recursive: true })
writeFileSync(join(dataDir, 'library.json'), JSON.stringify({ version: 1, items }, null, 2), 'utf8')
mkdirSync(outDir, { recursive: true })

// ---------- 启动与 CDP ----------
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
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? '页面脚本异常')
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
      // 还在启动
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

async function shoot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const file = join(outDir, name)
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log(`saved  docs/screenshots/${name}`)
}

const pause = (ms = 500) => new Promise((r) => setTimeout(r, ms))

const SET_INPUT = `
  window.__setValue = (el, value) => {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  window.__clickByText = (selector, text) => {
    const target = [...document.querySelectorAll(selector)].find((el) => el.textContent.includes(text))
    if (!target) throw new Error('未找到元素：' + selector + ' = ' + text)
    target.click()
    return true
  }
  true
`

try {
  const wsUrl = await waitForPage()
  await connect(wsUrl)
  await send('Page.enable')

  for (let attempt = 0; attempt < 40; attempt++) {
    if (await evaluate(`Boolean(document.querySelector('.type-card'))`)) break
    await pause(250)
  }
  await pause(1200)
  await evaluate(SET_INPUT)

  // 1. 根页面
  await shoot('01-home.png')

  // 2. 标签页（项目A）
  await evaluate(`window.__clickByText('.tag-card', '项目A'); true`)
  await pause(500)
  await shoot('02-tag-group.png')

  // 3. 右键菜单
  await evaluate(`
    (() => {
      const item = document.querySelectorAll('.item')[0]
      const box = item.getBoundingClientRect()
      item.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: Math.round(box.right - 30),
        clientY: Math.round(box.top + 60)
      }))
      return true
    })()
  `)
  await pause(400)
  await shoot('03-context-menu.png')

  // 4. 搜索
  await evaluate(`
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    window.__setValue(document.querySelector('.searchbox input'), '项目A')
    true
  `)
  await pause(600)
  await shoot('04-search.png')

  // 5. 添加弹窗（填一份真实感的表单）
  await evaluate(`
    (() => {
      window.__setValue(document.querySelector('.searchbox input'), '')
      return true
    })()
  `)
  await pause(400)
  await evaluate(`document.querySelector('.toolbar .btn-primary').click(); true`)
  await pause(500)
  await evaluate(`
    (() => {
      const inputs = document.querySelectorAll('.modal .input')
      window.__setValue(inputs[0], 'D:\\\\项目A\\\\bin\\\\测试工具.exe')
      window.__setValue(inputs[1], '测试工具.exe')
      return true
    })()
  `)
  await pause(300)
  await evaluate(`
    (() => {
      const textarea = document.querySelector('.modal textarea')
      window.__setValue(textarea, '项目A 串口压测工具，支持 115200 波特率')
      const tagInput = document.querySelector('.taginput input')
      const add = (value) => {
        window.__setValue(tagInput, value)
        tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      }
      add('项目A')
      add('测试工具')
      return true
    })()
  `)
  await pause(400)
  await shoot('05-add-modal.png')
} catch (error) {
  console.error('截图失败：', error.message)
  process.exitCode = 1
} finally {
  try {
    if (child.pid) execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } catch {
    // 进程可能已退出
  }
  ws?.close()
  rmSync(tempRoot, { recursive: true, force: true })
  rmSync(dataDir, { recursive: true, force: true })
}
