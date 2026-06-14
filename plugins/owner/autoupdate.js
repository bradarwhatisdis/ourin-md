import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { execSync } from 'child_process'

const pluginConfig = {
    name: 'autoupdate',
    alias: ['auto-update', 'scheduleupdate', 'auto-updatebot'],
    category: 'owner',
    description: 'Update otomatis dari repo GitHub. Cek & broadcast setiap ada commit baru.',
    usage: '.autoupdate <check/on/off/status>',
    example: '.autoupdate check',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const GITHUB_REPO = 'bradarwhatisdis/ourin-md'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1`
const BRANCH = 'main'
const STATE_FILE = path.join(process.cwd(), 'data', 'autoupdate-state.json')
const REPO_URL = `https://github.com/${GITHUB_REPO}.git`

const PRESERVE_ITEMS = [
    'config.js',
    'data',
    'session',
    'storage',
    'database',
    '.env',
    'node_modules',
    'tmp',
    'temp'
]

function getState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
        }
    } catch {}
    return { lastCommitSha: null, enabled: false, broadcast: true }
}

function saveState(state) {
    const dir = path.dirname(STATE_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
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
        const db = (await import('../../src/lib/ourin-database.js')).getDatabase()
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

async function performUpdate(m, sock, commitInfo) {
    const baseDir = process.cwd()
    const tempDir = path.join(baseDir, 'tmp', 'auto_update_clone')

    const updateMsg =
        `📥 *ᴀᴜᴛᴏ ᴜᴘᴅᴀᴛᴇ*\n\n` +
        `> Update baru terdeteksi!\n` +
        `> Memulai proses update...\n\n` +
        `📦 ${commitInfo?.commit?.message?.split('\n')[0] || 'Update terbaru'}\n` +
        `👤 ${commitInfo?.commit?.author?.name || 'Unknown'}\n` +
        `🔗 ${commitInfo?.html_url || ''}`

    if (m) {
        await m.reply(updateMsg)
    }

    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
    }

    try {
        execSync(`git clone --depth 1 --branch ${BRANCH} ${REPO_URL} "${tempDir}"`, {
            stdio: 'pipe', timeout: 120000
        })
    } catch (e) {
        const errMsg = `❌ Gagal clone: ${e.message}`
        if (m) await m.reply(errMsg)
        return false
    }

    const gitDir = path.join(tempDir, '.git')
    if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true })

    let copiedCount = 0
    try {
        copiedCount = copyRecursiveSync(tempDir, baseDir, PRESERVE_ITEMS)
    } catch (e) {
        if (m) await m.reply(`❌ Gagal copy: ${e.message}`)
        fs.rmSync(tempDir, { recursive: true, force: true })
        return false
    }

    fs.rmSync(tempDir, { recursive: true, force: true })

    try {
        execSync('npm install --production', { cwd: baseDir, timeout: 300000, stdio: 'pipe' })
    } catch {}

    const state = getState()
    state.lastCommitSha = commitInfo.sha
    saveState(state)

    return true
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

async function handler(m, { sock }) {
    const args = m.fullArgs?.trim().toLowerCase() || ''
    const state = getState()

    if (!args || args === 'status') {
        return m.reply(
            `⚙️ *ᴀᴜᴛᴏ ᴜᴘᴅᴀᴛᴇ*\n\n` +
            `📌 Repo: \`${GITHUB_REPO}\`\n` +
            `🌿 Branch: \`${BRANCH}\`\n` +
            `🔁 Status: ${state.enabled ? '✅ Aktif' : '❌ Nonaktif'}\n` +
            `📢 Broadcast: ${state.broadcast ? '✅ Ya' : '❌ Tidak'}\n` +
            `🔑 Last Commit: ${state.lastCommitSha ? state.lastCommitSha.slice(0, 7) : '-'}\n\n` +
            `*Perintah:*\n` +
            `> .autoupdate on — Aktifkan auto update\n` +
            `> .autoupdate off — Nonaktifkan\n` +
            `> .autoupdate broadcast — Toggle broadcast\n` +
            `> .autoupdate check — Cek & update manual\n` +
            `> .autoupdate status — Status saat ini`
        )
    }

    if (args === 'on') {
        state.enabled = true
        saveState(state)
        return m.reply('✅ *Auto update diaktifkan!*\n\nBot akan otomatis cek update setiap 30 menit.')
    }

    if (args === 'off') {
        state.enabled = false
        saveState(state)
        return m.reply('❌ *Auto update dinonaktifkan.*')
    }

    if (args === 'broadcast') {
        state.broadcast = !state.broadcast
        saveState(state)
        return m.reply(`${state.broadcast ? '✅' : '❌'} *Broadcast ${state.broadcast ? 'diaktifkan' : 'dinonaktifkan'}.`)
    }

    if (args === 'check') {
        await m.react('🕕')
        await m.reply('🔍 *Mengecek update...*')

        try {
            const latest = await getLatestCommit()
            if (!latest) {
                return m.reply('❌ Gagal mendapatkan info commit dari GitHub.')
            }

            const commitMsg = latest.commit?.message?.split('\n')[0] || 'No message'
            const author = latest.commit?.author?.name || 'Unknown'
            const sha = latest.sha
            const date = new Date(latest.commit?.author?.date).toLocaleString('id-ID')
            const url = latest.html_url || ''

            if (state.lastCommitSha === sha) {
                return m.reply(
                    `✅ *Tidak ada update terbaru*\n\n` +
                    `📌 Commit terakhir:\n` +
                    `┃ 🔑 \`${sha.slice(0, 7)}\`\n` +
                    `┃ 📝 ${commitMsg}\n` +
                    `┃ 👤 ${author}\n` +
                    `┃ 🕐 ${date}`
                )
            }

            const confirmMsg =
                `🆕 *Update tersedia!*\n\n` +
                `╭┈┈⬡「 📋 *ᴋᴏᴍɪᴛ ᴛᴇʀʙᴀʀᴜ* 」\n` +
                `┃ 🔑 \`${sha.slice(0, 7)}\`\n` +
                `┃ 📝 ${commitMsg}\n` +
                `┃ 👤 ${author}\n` +
                `┃ 🕐 ${date}\n` +
                `┃ 🔗 ${url}\n` +
                `╰┈┈⬡\n\n` +
                `> Update akan dijalankan dalam 5 detik...`

            await m.reply(confirmMsg)

            await new Promise(resolve => setTimeout(resolve, 5000))

            const success = await performUpdate(m, sock, latest)

            if (success) {
                const broadcastMsg =
                    `🆕 *ᴀᴜᴛᴏ ᴜᴘᴅᴀᴛᴇ ʙᴏᴛ*\n\n` +
                    `╭┈┈⬡「 📋 *ᴘᴇᴍʙᴀʀᴜᴀɴ* 」\n` +
                    `┃ 🔑 \`${sha.slice(0, 7)}\`\n` +
                    `┃ 📝 ${commitMsg}\n` +
                    `┃ 👤 ${author}\n` +
                    `┃ 🔗 ${url}\n` +
                    `╰┈┈⬡\n\n` +
                    `> ✅ Update berhasil!\n` +
                    `> Bot akan restart dalam 3 detik...`

                if (state.broadcast) {
                    const sent = await broadcastToAll(sock, broadcastMsg)
                    await m.reply(`📢 Broadcast terkirim ke ${sent} chat.`)
                }

                await m.reply(
                    `✅ *ᴜᴘᴅᴀᴛᴇ sᴇʟᴇsᴀɪ*\n\n` +
                    `> Bot akan restart dalam 3 detik...`
                )

                setTimeout(() => process.exit(0), 3000)
            } else {
                await m.reply('❌ *Update gagal!* Cek log untuk detail.')
            }

        } catch (e) {
            await m.reply('❌ Gagal mengecek update: ' + (e.message || 'Unknown error'))
        }

        return
    }

    return m.reply('❌ Perintah tidak dikenal. Gunakan `.autoupdate status` untuk melihat opsi.')
}

export { pluginConfig as config, handler }
