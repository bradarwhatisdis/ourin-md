const pluginConfig = {
    name: 'jsonfmt',
    alias: ['jsonformat', 'jsonbeautify', 'json', 'beautify', 'formatjson'],
    category: 'tools',
    description: 'Format / minify JSON',
    usage: '.jsonfmt (reply teks JSON)',
    example: '.jsonfmt (reply {"key":"value"})',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let text = m.fullArgs?.trim() || ''

    if (m.quoted) {
        text = m.quoted.text || m.quoted.body || m.quoted.caption || ''
        const args = m.fullArgs?.trim()
        if (args) text = args + ' ' + text
    }

    if (!text) {
        return m.reply(
            `⚙️ *ᴊsᴏɴ ғᴍᴛ*\n\n` +
            `> .jsonfmt <json>\n` +
            `> Atau reply teks JSON\n\n` +
            `*Fitur:*\n` +
            `▸ .jsonfmt <json> — Beautify\n` +
            `▸ .jsonfmt min <json> — Minify\n\n` +
            `*Contoh:*\n` +
            `> .jsonfmt {"nama":"John","umur":30}`
        )
    }

    let mode = 'beautify'
    let jsonStr = text

    const first = text.split(/\s+/)[0].toLowerCase()
    if (['min', 'minify', 'compact'].includes(first)) {
        mode = 'minify'
        jsonStr = text.slice(first.length).trim()
    }

    if (jsonStr.startsWith('```') && jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(3, -3).replace(/^(json)\n?/i, '').trim()
    }

    if (jsonStr.startsWith('```') && jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(3, -3).trim()
    }

    try {
        const parsed = JSON.parse(jsonStr)
        let result, label

        if (mode === 'beautify') {
            result = JSON.stringify(parsed, null, 2)
            label = '📋 Beautified'
        } else {
            result = JSON.stringify(parsed)
            label = '📏 Minified'
        }

        const countBefore = jsonStr.length
        const countAfter = result.length
        const savings = countBefore - countAfter

        const truncated = result.length > 4000 ? result.slice(0, 4000) + '\n\n... (truncated)' : result

        await m.reply(
            `⚙️ *ᴊsᴏɴ ғᴍᴛ*\n\n` +
            `${label}\n` +
            `━━━━━━━━━━━━━━\n\n` +
            `\`\`\`${truncated}\`\`\`\n` +
            `━━━━━━━━━━━━━━\n` +
            `📏 ${countBefore} → ${countAfter} chars${mode === 'minify' ? ` (hemat ${savings})` : ''}`
        )
    } catch (e) {
        await m.reply(
            `❌ *JSON tidak valid!*\n\n` +
            `${e.message.slice(0, 200)}`
        )
    }
}

export { pluginConfig as config, handler }
