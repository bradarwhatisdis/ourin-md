import { getAssetBuffer } from "../../src/lib/ourin-asset-manager.js";
import fs from "fs";
import config from "../../config.js";
import { getDatabase } from "../../src/lib/ourin-database.js";
const pluginConfig = {
  name: "setreply",
  alias: ["replyvariant", "replystyle"],
  category: "owner",
  description: "Mengatur variant tampilan reply",
  usage: ".setreply <v1-v11>",
  example: ".setreply v5",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

const VARIANTS = {
  v1: {
    id: 1,
    name: "BASIC",
    desc: "",
    emoji: "✨",
  },
  v2: {
    id: 2,
    name: "PREMIUM",
    desc: "",
    emoji: "🖼️",
  },
  v3: {
    id: 3,
    name: "TITANIUM",
    desc: "",
    emoji: "📨",
  },
  v4: {
    id: 4,
    name: "LV",
    desc: "",
    emoji: "",
  },
};

async function handler(m, { sock, db }) {
  const args = m.args || [];
  const variant = args[0]?.toLowerCase();

  if (variant) {
    const selected = VARIANTS[variant];
    if (!selected) {
      await m.reply(`❌ *VARIANT TIDAK VALID*\n\nGunakan: *v1* s/d *v3*`);
      return;
    }

    db.setting("replyVariant", selected.id);
    await db.save();

    await m.reply(
      `✅ *REPLY VARIANT DIUBAH*\n\n` +
      `${selected.emoji} *V${selected.id} — ${selected.name}*\n` +
      `_${selected.desc}_`,
    );
    return;
  }

  const current = db.setting("replyVariant") || config.ui?.replyVariant || 1;

  const rows = [];
  for (const [key, val] of Object.entries(VARIANTS)) {
    const mark = val.id === current ? " ✓" : "";
    rows.push({
      title: `${val.emoji} ${key.toUpperCase()}${mark} — ${val.name}`,
      description: val.desc,
      id: `${m.prefix}setreply ${key}`,
    });
  }
  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "💬 Pilih Variant Reply",
        sections: [{ title: "Daftar Variant Reply", rows }],
      }),
    },
  ];

  const bodyText =
    `💬📨 *REPLY VARIANT*\n\n` +
    `Atur tampilan balasan bot ketika membalas pesan user 💬✨\n` +
    `Variant aktif saat ini: *V${current} — ${VARIANTS[`v${current}`]?.name || "Unknown"}* 🎯\n\n` +

    await sock.sendButton(
      m.chat,
      getAssetBuffer("ourin"),
      bodyText,
      m,
      { buttons },
    );
}

export { pluginConfig as config, handler };
