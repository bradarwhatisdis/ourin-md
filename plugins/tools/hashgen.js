import crypto from 'crypto'

const pluginConfig = {
    name: 'hashgen',
    alias: ['hash', 'md5', 'sha1', 'sha256', 'sha512'],
    category: 'tools',
    description: 'Generate hash MD5/SHA1/SHA256/SHA512 dari teks',
    usage: '.hash md5 <teks>',
    example: '.hash md5 Hello World',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let args = m.fullArgs?.trim() || ''

    if (m.quoted) {
        const quotedText = m.quoted.text || m.quoted.body || m.quoted.caption || ''
        args = args ? args + ' ' + quotedText : quotedText
    }

    if (!args) {
        return m.reply(
            `⚙️ *ʜᴀsʜɢᴇɴ*\n\n` +
            `> .hash <tipe> <teks>\n\n` +
            `*Tipe:* md5, sha1, sha256, sha512\n\n` +
            `*Contoh:*\n` +
            `> .hash md5 Hello World\n` +
            `> .sha256 rahasia`
        )
    }

    const parts = args.split(/\s+/)
    const first = parts[0].toLowerCase()
    let type = 'md5'
    let text = args

    if (['md5', 'sha1', 'sha256', 'sha512'].includes(first)) {
        type = first
        text = parts.slice(1).join(' ')
    }

    if (!text) {
        return m.reply('❌ Teks tidak boleh kosong!')
    }

    let hash
    switch (type) {
        case 'md5':
            hash = crypto.createHash('md5').update(text).digest('hex')
            break
        case 'sha1':
            hash = crypto.createHash('sha1').update(text).digest('hex')
            break
        case 'sha256':
            hash = crypto.createHash('sha256').update(text).digest('hex')
            break
        case 'sha512':
            hash = crypto.createHash('sha512').update(text).digest('hex')
            break
        default:
            return m.reply('❌ Tipe hash tidak valid! gunakan: md5, sha1, sha256, sha512')
    }

    await m.reply(
        `🔐 *ʜᴀsʜɢᴇɴ*\n\n` +
        `📝 *Input:* ${text.slice(0, 100)}\n` +
        `🔢 *Tipe:* ${type.toUpperCase()}\n` +
        `━━━━━━━━━━━━━━\n` +
        `\`\`\`${hash}\`\`\`\n` +
        `━━━━━━━━━━━━━━\n` +
        `📏 Panjang: ${hash.length} karakter`
    )
}

export { pluginConfig as config, handler }
