import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'wikipedia',
    alias: ['wiki', 'pedia'],
    category: 'search',
    description: 'Cari artikel di Wikipedia',
    usage: '.wiki <query>',
    example: '.wiki Indonesia',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.fullArgs?.trim() || ''

    if (!query) {
        return m.reply(
            `⚙️ *ᴡɪᴋɪᴘᴇᴅɪᴀ*\n\n` +
            `> .wiki <query>\n\n` +
            `*Contoh:*\n` +
            `> .wiki Javascript\n` +
            `> .wiki Gunung Everest`
        )
    }

    try {
        const { data: search } = await axios.get('https://id.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                format: 'json',
                list: 'search',
                srsearch: query,
                srlimit: 1,
                utf8: 1
            }
        })

        if (!search.query?.search?.length) {
            return m.reply('❌ Artikel tidak ditemukan!')
        }

        const pageTitle = search.query.search[0].title

        const { data: page } = await axios.get('https://id.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                format: 'json',
                prop: 'extracts|info',
                exintro: true,
                explaintext: true,
                inprop: 'url',
                titles: pageTitle,
                utf8: 1
            }
        })

        const pages = Object.values(page.query.pages)[0]
        const extract = pages.extract?.trim() || 'Deskripsi tidak tersedia.'
        const url = pages.fullurl || `https://id.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`

        const summary = extract.length > 2000 ? extract.slice(0, 2000) + '...' : extract

        await m.reply(
            `📖 *ᴡɪᴋɪᴘᴇᴅɪᴀ*\n\n` +
            `📌 *${pageTitle}*\n\n` +
            `${summary}\n\n` +
            `🔗 ${url}`
        )
    } catch (e) {
        await m.reply('❌ Gagal mencari: ' + (e.message || 'Unknown error'))
    }
}

export { pluginConfig as config, handler }
