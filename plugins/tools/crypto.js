import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'crypto',
    alias: ['bitcoin', 'eth', 'cryptoprice', 'coinprice'],
    category: 'tools',
    description: 'Cek harga cryptocurrency terkini',
    usage: '.crypto <coin>',
    example: '.crypto bitcoin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const topCoins = [
    'bitcoin', 'ethereum', 'tether', 'solana', 'bnb',
    'ripple', 'dogecoin', 'cardano', 'tron', 'avalanche-2',
    'shiba-inu', 'polkadot', 'chainlink', 'near', 'polygon',
    'litecoin', 'pepe', 'uniswap', 'stellar', 'aptos'
]

async function handler(m, { sock }) {
    let coin = m.fullArgs?.trim().toLowerCase() || ''

    if (!coin) {
        return m.reply(
            `⚙️ *ᴄʀʏᴘᴛᴏ*\n\n` +
            `> .crypto <nama-coin>\n\n` +
            `*Coin populer:*\n` +
            topCoins.map(c => `▸ ${c.split('-')[0]}`).join('\n') +
            `\n\n*Contoh:*\n` +
            `> .crypto bitcoin\n` +
            `> .crypto ethereum`
        )
    }

    try {
        const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: coin,
                vs_currencies: 'usd,idr',
                include_24hr_change: 'true',
                include_market_cap: 'true',
                include_24hr_vol: 'true'
            },
            headers: { 'Accept': 'application/json' }
        })

        const coinData = data[coin]
        if (!coinData) {
            return m.reply(`❌ Coin "${coin}" tidak ditemukan!\nCoba gunakan nama dari CoinGecko.`)
        }

        const usd = coinData.usd?.toLocaleString('en') || 'N/A'
        const idr = coinData.idr?.toLocaleString('id') || 'N/A'
        const change = coinData.usd_24h_change
        const changeStr = change ? `${change >= 0 ? '📈' : '📉'} ${change.toFixed(2)}%` : 'N/A'
        const mc = coinData.usd_market_cap
        const mcStr = mc ? '$' + (mc / 1e9).toFixed(2) + 'B' : 'N/A'
        const vol = coinData.usd_24h_vol
        const volStr = vol ? '$' + (vol / 1e9).toFixed(2) + 'B' : 'N/A'

        const coinDisplay = coin.charAt(0).toUpperCase() + coin.slice(1).replace(/-/g, ' ')

        await m.reply(
            `💰 *ᴄʀʏᴘᴛᴏ*\n\n` +
            `🪙 *${coinDisplay}*\n` +
            `━━━━━━━━━━━━━━\n\n` +
            `💵 USD: ‎‎$${usd}\n` +
            `🇮🇩 IDR:‎‎ Rp${idr}\n` +
            `📊 24h: ${changeStr}\n` +
            `🏦 Market Cap: ${mcStr}\n` +
            `📈 Volume 24h: ${volStr}\n\n` +
            `_Data dari CoinGecko_`
        )
    } catch (e) {
        if (e.response?.status === 429) {
            return m.reply('⏳ Terlalu banyak permintaan, coba lagi nanti.')
        }
        await m.reply('❌ Gagal: ' + (e.message || 'Unknown error'))
    }
}

export { pluginConfig as config, handler }
