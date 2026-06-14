import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'qrreader',
    alias: ['readqr', 'scanqr', 'qrcode'],
    category: 'tools',
    description: 'Baca QR Code dari gambar',
    usage: '.readqr (reply/sertakan gambar)',
    example: '.readqr (reply gambar QR)',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    let imageUrl = null

    if (m.quoted?.message?.imageMessage) {
        const buffer = await m.quoted.download()
        if (!buffer) return m.reply('❌ Gagal mengunduh gambar!')
        const { data } = await axios.post('https://api.trace.moe/ocr', buffer, {
            headers: { 'Content-Type': 'application/octet-stream' }
        })
    }

    try {
        let media

        if (m.quoted?.message?.imageMessage || m.quoted?.message?.stickerMessage) {
            media = await m.quoted.download()
        } else if (m.message?.imageMessage) {
            media = await m.download()
        }

        if (!media) {
            return m.reply(
                `⚙️ *ǫʀ ʀᴇᴀᴅᴇʀ*\n\n` +
                `> Reply gambar yang berisi QR Code!\n\n` +
                `*Cara:*\n` +
                `> Kirim gambar QR, reply, lalu .readqr`
            )
        }

        const base64 = media.toString('base64')
        const { data } = await axios.post('https://api.qrserver.com/v1/read-qr-code/', {
            file: base64
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        })

        const result = data?.[0]?.symbol?.[0]?.data
        if (!result) {
            return m.reply('❌ Tidak dapat membaca QR Code dari gambar tersebut.')
        }

        await m.reply(
            `📷 *ǫʀ ʀᴇᴀᴅᴇʀ*\n\n` +
            `📄 *Hasil:*\n` +
            `\`\`\`${result}\`\`\``
        )
    } catch (e) {
        await m.reply('❌ Gagal membaca QR: ' + (e.message || 'Unknown error'))
    }
}

export { pluginConfig as config, handler }
