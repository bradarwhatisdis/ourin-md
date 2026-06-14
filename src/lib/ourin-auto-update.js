import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { execSync } from 'child_process'
import { getDatabase } from './ourin-database.js'
import { logger } from './ourin-logger.js'

const GITHUB_REPO = 'bradarwhatisdis/ourin-md'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1`
const BRANCH = 'main'
const STATE_FILE = path.join(process.cwd(), 'data', 'autoupdate-state.json')
const REPO_URL = `https://github.com/${GITHUB_REPO}.git`

const PRESERVE_ITEMS = [
    'config.js', 'data', 'session', 'storage', 'database',
    '.env', 'node_modules', 'tmp', 'temp'
]

function getState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
        }
    } catch {}
    return { lastCommitSha: null, enabled: false, broadcast: true }
}

function copyRecursiveSync(src, dest, preserve, relativePath = '') {
    const stats = fs.statSync(src)
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
        const entries = fs.readdirSync(src)
        let count = 0
        for (const entry of entries) {
            const relPath = relativePath ? `${relativePath}/${entry}` : entry
            const shouldPreserve = preserve.some(p => relPath === p || relPath.startsWith(p + '/'))
            if (shouldPreserve) continue
            count += copyRecursiveSync(path.join(src, entry), path.join(dest, entry), preserve, relPath)
        }
        return count
    }
    const dir = path.dirname(dest)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.copyFileSync(src, dest)
    return 1
}

async function getLatestCommit() {
    const { data } = await axios.get(GITHUB_API, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ourin-md' },
        timeout: 10000
    })
    return data[0]
}

async function broadcastToAll(sock, message) {
    try {
        const db = getDatabase()
        const chats = db.data?.chats || []
        let sent = 0
        for (const chatId of chats) {
            try {
                await sock.sendMessage(chatId, { text: message })
                sent++
            } catch {}
        }
        return sent
    } catch {
        return 0
    }
}

async function performUpdate(sock, commitInfo) {
    const baseDir = process.cwd()
    const tempDir = path.join(baseDir, 'tmp', 'auto_update_clone')

    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
    }

    execSync(`git clone --depth 1 --branch ${BRANCH} ${REPO_URL} "${tempDir}"`, {
        stdio: 'pipe', timeout: 120000
    })

    const gitDir = path.join(tempDir, '.git')
    if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true })

    const copiedCount = copyRecursiveSync(tempDir, baseDir, PRESERVE_ITEMS)
    fs.rmSync(tempDir, { recursive: true, force: true })

    try {
        execSync('npm install --production', { cwd: baseDir, timeout: 300000, stdio: 'pipe' })
    } catch {}

    const state = getState()
    state.lastCommitSha = commitInfo.sha
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))

    return copiedCount
}

export async function initAutoUpdate(sock) {
    logger.info('AUTOUPDATE', 'Initializing auto-update checker...')

    setInterval(async () => {
        try {
            const state = getState()
            if (!state.enabled) return

            const latest = await getLatestCommit()
            if (!latest || state.lastCommitSha === latest.sha) return

            const sha = latest.sha
            const commitMsg = latest.commit?.message?.split('\n')[0] || 'Update'
            const author = latest.commit?.author?.name || 'Unknown'
            const url = latest.html_url || ''

            logger.info('AUTOUPDATE', `New commit detected: ${sha.slice(0, 7)}`)

            const broadcastMsg =
                `🆕 *ᴀᴜᴛᴏ ᴜᴘᴅᴀᴛᴇ ʙᴏᴛ*\n\n` +
                `╭┈┈⬡「 📋 *ᴘᴇᴍʙᴀʀᴜᴀɴ* 」\n` +
                `┃ 🔑 \`${sha.slice(0, 7)}\`\n` +
                `┃ 📝 ${commitMsg}\n` +
                `┃ 👤 ${author}\n` +
                `┃ 🔗 ${url}\n` +
                `╰┈┈⬡\n\n` +
                `> ⏳ Update sedang dijalankan...\n` +
                `> Bot akan restart otomatis.`

            if (state.broadcast) {
                await broadcastToAll(sock, broadcastMsg)
            }

            await performUpdate(sock, latest)

            logger.info('AUTOUPDATE', `Update complete, restarting...`)

            setTimeout(() => process.exit(0), 3000)

        } catch (e) {
            logger.warn('AUTOUPDATE', `Check failed: ${e.message}`)
        }
    }, 30 * 60 * 1000)

    logger.info('AUTOUPDATE', 'Auto-update checker running (interval: 30 min)')
}
