import crypto from 'crypto'

const pluginConfig = {
    name: 'passgen',
    alias: ['password', 'genpass', 'generatepassword'],
    category: 'tools',
    description: 'Generate password acak yang kuat',
    usage: '.passgen <panjang>',
    example: '.passgen 16',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

function generatePassword(length, options = {}) {
    const defaults = {
        uppercase: true, lowercase: true, numbers: true, symbols: true
    }
    const opts = { ...defaults, ...options }

    const pools = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }

    let chars = ''
    for (const [key, pool] of Object.entries(pools)) {
        if (opts[key]) chars += pool
    }

    if (!chars) return ''

    const bytes = crypto.randomBytes(length)
    let password = ''

    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length]
    }

    return password
}

async function handler(m, { sock }) {
    const args = m.fullArgs?.trim() || ''

    if (!args) {
        return m.reply(
            `⚙️ *ᴘᴀꜱꜱɢᴇɴ*\n\n` +
            `> .passgen <panjang>\n\n` +
            `*Contoh:*\n` +
            `> .passgen 12\n` +
            `> .passgen 24\n` +
            `> .passgen 32`
        )
    }

    let length = parseInt(args)
    if (isNaN(length) || length < 4) length = 12
    if (length > 128) length = 128

    const passwords = []
    for (let i = 0; i < 5; i++) {
        passwords.push(generatePassword(length))
    }

    const output = passwords.map((pw, i) => `${i + 1}. \`${pw}\``).join('\n')

    await m.reply(
        `🔐 *ᴘᴀꜱꜱɢᴇɴ*\n\n` +
        `📏 Panjang: ${length} karakter\n` +
        `🔢 Jumlah: 5 password\n\n` +
        `${output}\n\n` +
        `_💡 Gunakan yang paling kuat & acak!_`
    )
}

export { pluginConfig as config, handler }
