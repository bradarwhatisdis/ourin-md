const pluginConfig = {
    name: 'base64',
    alias: ['b64', 'encode', 'decode', 'base64encode', 'base64decode'],
    category: 'tools',
    description: 'Encode / decode Base64',
    usage: '.b64 encode <teks> / .b64 decode <teks>',
    example: '.b64 encode Hello World',
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
            `⚙️ *ʙᴀsᴇ64*\n\n` +
            `> .b64 encode <teks>\n` +
            `> .b64 decode <teks>\n\n` +
            `*Contoh:*\n` +
            `> .b64 encode Hello World\n` +
            `> .b64 decode SGVsbG8=`
        )
    }

    const parts = args.split(/\s+/)
    let mode = 'encode'
    let text = args

    if (['encode', 'enc', 'enkripsi'].includes(parts[0].toLowerCase())) {
        mode = 'encode'
        text = parts.slice(1).join(' ')
    } else if (['decode', 'dec', 'deskripsi', 'dc'].includes(parts[0].toLowerCase())) {
        mode = 'decode'
        text = parts.slice(1).join(' ')
    }

    if (!text) {
        return m.reply('❌ Teks tidak boleh kosong!')
    }

    try {
        let result, label

        if (mode === 'encode') {
            result = Buffer.from(text).toString('base64')
            label = '🔐 Encode'
        } else {
            result = Buffer.from(text, 'base64').toString('utf-8')
            label = '🔓 Decode'
        }

        const truncated = result.length > 3000 ? result.slice(0, 3000) + '\n\n... (truncated)' : result

        await m.reply(
            `⚙️ *ʙᴀsᴇ64*\n\n` +
            `${label}\n` +
            `━━━━━━━━━━━━━━\n\n` +
            `\`\`\`${truncated}\`\`\`\n` +
            `━━━━━━━━━━━━━━\n` +
            `📏 Panjang: ${result.length} karakter`
        )
    } catch (e) {
        await m.reply('❌ Gagal: Text tidak valid untuk decoding Base64')
    }
}

export { pluginConfig as config, handler }
