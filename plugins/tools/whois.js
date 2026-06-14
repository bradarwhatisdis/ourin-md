import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'whois',
    alias: ['domain', 'domaincheck'],
    category: 'tools',
    description: 'Cek informasi domain (WHOIS)',
    usage: '.whois <domain>',
    example: '.whois google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const domain = m.fullArgs?.trim().toLowerCase() || ''

    if (!domain) {
        return m.reply(
            `⚙️ *ᴡʜᴏɪs*\n\n` +
            `> .whois <domain>\n\n` +
            `*Contoh:*\n` +
            `> .whois google.com\n` +
            `> .whois github.com`
        )
    }

    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
        return m.reply('❌ Format domain tidak valid!')
    }

    try {
        const { data } = await axios.get(`https://who-dat.as93.net/${domain}`, {
            timeout: 10000
        })

        const info = [
            ['Domain', data.domain || domain],
            ['Registrar', data.registrar || '-'],
            ['Created', data.created || data.creation_date || '-'],
            ['Expires', data.expires || data.expiration_date || '-'],
            ['Updated', data.updated || data.updated_date || '-'],
            ['Name Servers', Array.isArray(data.nameservers) ? data.nameservers.join(', ') : (data.nameservers || '-')],
            ['Status', data.status || '-'],
            ['Registrant', data.registrant_name || data.name || '-'],
            ['Organization', data.registrant_organization || data.organization || '-'],
            ['Country', data.country || data.registrant_country || '-'],
            ['Email', data.registrant_email || data.email || '-'],
            ['DNSSEC', data.dnssec || 'unspecified']
        ]

        const output = info
            .filter(([, v]) => v && v !== '-' && v !== 'unspecified')
            .map(([k, v]) => `▸ *${k}:* ${v}`)
            .join('\n')

        await m.reply(
            `🌐 *ᴅᴏᴍᴀɪɴ ɪɴꜰᴏ*\n\n` +
            `📌 *${domain}*\n` +
            `━━━━━━━━━━━━━━\n\n` +
            `${output}\n\n` +
            `_Data dari who-dat.as93.net_`
        )
    } catch (e) {
        if (e.response?.status === 404) {
            return m.reply(`❌ Domain "${domain}" tidak ditemukan!`)
        }
        await m.reply('❌ Gagal: ' + (e.message || 'Unknown error'))
    }
}

export { pluginConfig as config, handler }
