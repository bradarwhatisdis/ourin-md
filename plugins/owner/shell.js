import { exec } from 'child_process'
import util from 'util'
const execAsync = util.promisify(exec)

const pluginConfig = {
    name: 'shell',
    alias: ['$', 'sh', 'bash', 'terminal', 'cmd'],
    category: 'owner',
    description: 'Jalankan command Linux langsung (Owner Only)',
    usage: '.$ <command>',
    example: '.$ ls -la',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let command = null

    if (m.quoted) {
        command = m.quoted.text || m.quoted.body || m.quoted.caption
    }

    if (!command) {
        command = m.fullArgs?.trim() || m.text?.trim()
    }

    if (!command) {
        return m.reply(
            `⚙️ *sʜᴇʟʟ*\n\n` +
            `> Reply pesan berisi command Linux!\n\n` +
            `*Atau:*\n` +
            `> .\\$ <command>\n\n` +
            `*Contoh:*\n` +
            `> .\\$ ls -la /home\n` +
            `> .\\$ node -v\n` +
            `> .\\$ df -h`
        )
    }

    command = command.trim()

    if (command.startsWith('```') && command.endsWith('```')) {
        command = command.slice(3, -3)
        if (command.startsWith('bash') || command.startsWith('sh')) {
            command = command.replace(/^(bash|sh)\n?/, '')
        }
    }

    await m.reply(`⏳ *Executing...*\n\`\`\`$ ${command}\`\`\``)

    try {
        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000,
            maxBuffer: 2 * 1024 * 1024,
            cwd: process.cwd()
        })

        let output = ''
        if (stdout) output += stdout
        if (stderr) output += stderr
        if (!output) output = '[no output]'

        if (output.length > 4000) {
            output = output.slice(0, 4000) + '\n\n... (truncated)'
        }

        await m.reply(
            `✅ *sʜᴇʟʟ ʀᴇsᴜʟᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴏᴍᴍᴀɴᴅ* 」\n` +
            `┃ \`$ ${command}\`\n` +
            `├┈┈⬡「 📄 *ᴏᴜᴛᴘᴜᴛ* 」\n` +
            `┃\n` +
            `\`\`\`${output}\`\`\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    } catch (e) {
        const errorOutput = e.stderr || e.stdout || e.message || String(e)
        const trimmed = errorOutput.length > 3000
            ? errorOutput.slice(0, 3000) + '\n\n... (truncated)'
            : errorOutput

        await m.reply(
            `❌ *sʜᴇʟʟ ᴇʀʀᴏʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴏᴍᴍᴀɴᴅ* 」\n` +
            `┃ \`$ ${command}\`\n` +
            `├┈┈⬡「 ❗ *ᴇʀʀᴏʀ* 」\n` +
            `┃\n` +
            `\`\`\`${trimmed}\`\`\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
}

export { pluginConfig as config, handler }
