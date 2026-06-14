import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'weather',
    alias: ['cuaca', 'ramalan'],
    category: 'tools',
    description: 'Cek ramalan cuaca suatu kota',
    usage: '.cuaca <nama-kota>',
    example: '.cuaca Jakarta',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const city = m.fullArgs?.trim() || ''

    if (!city) {
        return m.reply(
            `⚙️ *ᴄᴜᴀᴄᴀ*\n\n` +
            `> .cuaca <nama-kota>\n\n` +
            `*Contoh:*\n` +
            `> .cuaca Jakarta\n` +
            `> .cuaca Surabaya\n` +
            `> .cuaca Tokyo`
        )
    }

    try {
        const { data: geo } = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
            params: { name: city, count: 1, language: 'id', format: 'json' }
        })

        if (!geo.results?.length) {
            return m.reply('❌ Kota tidak ditemukan!')
        }

        const loc = geo.results[0]
        const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: loc.latitude,
                longitude: loc.longitude,
                daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant',
                current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
                timezone: 'auto',
                forecast_days: 3
            }
        })

        const wmo = {
            0: '☀️ Cerah', 1: '🌤️ Cerah Berawan', 2: '⛅ Sebagian Berawan', 3: '☁️ Berawan',
            45: '🌫️ Berkabut', 48: '🌫️ Kabut', 51: '🌦️ Gerimis Ringan', 53: '🌦️ Gerimis',
            55: '🌧️ Gerimis Deras', 56: '🌧️ Gerimis Beku', 57: '🌧️ Gerimis Beku Deras',
            61: '🌧️ Hujan Ringan', 63: '🌧️ Hujan', 65: '🌧️ Hujan Deras',
            71: '🌨️ Salju Ringan', 73: '🌨️ Salju', 75: '🌨️ Salju Deras',
            80: '🌦️ Hujan Sebentar', 81: '🌧️ Hujan Sedang', 82: '🌧️ Hujan Deras',
            95: '⛈️ Badai Petir', 96: '⛈️ Badai Petir + Hujan Es', 99: '⛈️ Badai Petir + Hujan Es'
        }

        const current = data.current
        const daily = data.daily
        const curWeather = wmo[current.weather_code] || '❓ Tidak diketahui'

        const cityName = [loc.admin1, loc.country].filter(Boolean).join(', ')

        let forecastText = ''
        for (let i = 0; i < daily.time.length; i++) {
            const date = new Date(daily.time[i]).toLocaleDateString('id', { weekday: 'long', day: 'numeric', month: 'short' })
            const w = wmo[daily.weather_code[i]] || '❓'
            forecastText += `▸ ${date}: ${w} ${daily.temperature_2m_min[i]}°C - ${daily.temperature_2m_max[i]}°C\n`
        }

        const windDirections = ['⬇️ U', '↗️ TL', '➡️ T', '↘️ TG', '⬆️ S', '↙️ BD', '⬅️ B', '↖️ BL']
        const windDir = windDirections[Math.round(daily.wind_direction_10m_dominant[0] / 45) % 8] || '❓'

        await m.reply(
            `🌤️ *ᴄᴜᴀᴄᴀ*\n\n` +
            `📍 *${loc.name}* — ${cityName}\n` +
            `━━━━━━━━━━━━━━\n\n` +
            `🔴 *Sekarang*\n` +
            `▸ Cuaca: ${curWeather}\n` +
            `▸ Suhu: ${current.temperature_2m}°C\n` +
            `▸ Kelembapan: ${current.relative_humidity_2m}%\n` +
            `▸ Angin: ${current.wind_speed_10m} km/j ${windDir}\n\n` +
            `📅 *Prakiraan 3 Hari*\n` +
            `${forecastText}`
        )
    } catch (e) {
        await m.reply('❌ Gagal mendapatkan cuaca: ' + (e.message || 'Unknown error'))
    }
}

export { pluginConfig as config, handler }
