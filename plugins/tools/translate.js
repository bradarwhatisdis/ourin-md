import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'translate',
    alias: ['tr', 'terjemah', 'translate'],
    category: 'tools',
    description: 'Terjemahkan teks ke bahasa lain',
    usage: '.tr <kode-bahasa> <teks>',
    example: '.tr en Selamat pagi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

const langNames = {
    af: 'Afrikaans', sq: 'Albanian', ar: 'Arabic', hy: 'Armenian',
    az: 'Azerbaijani', eu: 'Basque', be: 'Belarusian', bn: 'Bengali',
    bs: 'Bosnian', bg: 'Bulgarian', ca: 'Catalan', ceb: 'Cebuano',
    zh: 'Chinese', co: 'Corsican', hr: 'Croatian', cs: 'Czech',
    da: 'Danish', nl: 'Dutch', en: 'English', eo: 'Esperanto',
    et: 'Estonian', fi: 'Finnish', fr: 'French', fy: 'Frisian',
    gl: 'Galician', ka: 'Georgian', de: 'German', el: 'Greek',
    gu: 'Gujarati', ht: 'Haitian Creole', ha: 'Hausa', haw: 'Hawaiian',
    he: 'Hebrew', hi: 'Hindi', hmn: 'Hmong', hu: 'Hungarian',
    is: 'Icelandic', ig: 'Igbo', id: 'Indonesian', ga: 'Irish',
    it: 'Italian', ja: 'Japanese', jw: 'Javanese', kn: 'Kannada',
    kk: 'Kazakh', km: 'Khmer', rw: 'Kinyarwanda', ko: 'Korean',
    ku: 'Kurdish', ky: 'Kyrgyz', lo: 'Lao', la: 'Latin',
    lv: 'Latvian', lt: 'Lithuanian', lb: 'Luxembourgish', mk: 'Macedonian',
    mg: 'Malagasy', ms: 'Malay', ml: 'Malayalam', mt: 'Maltese',
    mi: 'Maori', mr: 'Marathi', mn: 'Mongolian', my: 'Myanmar',
    ne: 'Nepali', no: 'Norwegian', ny: 'Nyanja', or: 'Odia',
    ps: 'Pashto', fa: 'Persian', pl: 'Polish', pt: 'Portuguese',
    pa: 'Punjabi', ro: 'Romanian', ru: 'Russian', sm: 'Samoan',
    gd: 'Scots Gaelic', sr: 'Serbian', st: 'Sesotho', sn: 'Shona',
    sd: 'Sindhi', si: 'Sinhala', sk: 'Slovak', sl: 'Slovenian',
    so: 'Somali', es: 'Spanish', su: 'Sundanese', sw: 'Swahili',
    sv: 'Swedish', tl: 'Tagalog', tg: 'Tajik', ta: 'Tamil',
    tt: 'Tatar', te: 'Telugu', th: 'Thai', tr: 'Turkish',
    tk: 'Turkmen', uk: 'Ukrainian', ur: 'Urdu', ug: 'Uyghur',
    uz: 'Uzbek', vi: 'Vietnamese', cy: 'Welsh', xh: 'Xhosa',
    yi: 'Yiddish', yo: 'Yoruba', zu: 'Zulu'
}

async function handler(m, { sock }) {
    let args = m.fullArgs?.trim() || m.text?.trim() || ''

    if (m.quoted) {
        const quotedText = m.quoted.text || m.quoted.body || m.quoted.caption || ''
        args = args ? args + ' ' + quotedText : quotedText
    }

    if (!args) {
        const langList = Object.entries(langNames)
            .map(([code, name]) => `${code} = ${name}`)
            .join('\n')

        return m.reply(
            `⚙️ *ᴛʀᴀɴsʟᴀᴛᴇ*\n\n` +
            `> .tr <kode-bahasa> <teks>\n` +
            `> Atau reply pesan: .tr en\n\n` +
            `*Contoh:*\n` +
            `> .tr en Selamat pagi\n` +
            `> .tr id Hello world\n\n` +
            `*Kode Bahasa:*\n` +
            `\`\`\`${langList}\`\`\``
        )
    }

    let targetLang = 'id'
    let text = args

    const firstWord = args.split(/\s+/)[0]
    if (langNames[firstWord]) {
        targetLang = firstWord
        text = args.slice(firstWord.length).trim()
    } else if (firstWord.length === 2) {
        targetLang = firstWord
        text = args.slice(firstWord.length).trim()
    }

    if (!text) {
        return m.reply('❌ Teks tidak ditemukan!')
    }

    try {
        const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: 'auto',
                tl: targetLang,
                dt: 't',
                q: text
            }
        })

        const result = data[0]?.map(item => item[0]).filter(Boolean).join('') || ''
        const detectedLang = data[2] || '?'

        await m.reply(
            `🌐 *ᴛʀᴀɴsʟᴀᴛᴇ*\n\n` +
            `📝 *Input:* ${text.slice(0, 500)}\n` +
            `🔍 *Detected:* ${langNames[detectedLang] || detectedLang}\n` +
            `🎯 *Target:* ${langNames[targetLang] || targetLang}\n` +
            `━━━━━━━━━━━━━━\n` +
            `${result.slice(0, 2000)}`
        )
    } catch (e) {
        await m.reply('❌ Gagal menerjemahkan: ' + (e.message || 'Unknown error'))
    }
}

export { pluginConfig as config, handler }
