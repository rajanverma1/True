// ============================================================
//  TrueCloud Discord Server Setup Bot (REST only - no WebSocket)
// ============================================================

const { REST, Routes, PermissionFlagsBits } = require("discord.js");

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID  = process.env.GUILD_ID;

if (!BOT_TOKEN || !GUILD_ID) {
  console.error("❌ Missing BOT_TOKEN or GUILD_ID environment variables.");
  process.exit(1);
}

// Channel types (raw values — no Client needed)
const TEXT     = 0;
const VOICE    = 2;
const CATEGORY = 4;
const NEWS     = 5; // announcements

const ROLES = [
  { name: "☁️ TrueCloud Team",  color: 0x00CFFF, hoist: true  },
  { name: "🛡️ Moderator",       color: 0x7289DA, hoist: true  },
  { name: "💎 TrueCloud Pro",    color: 0xFFD700, hoist: true  },
  { name: "🌟 TrueCloud Plus",   color: 0xC084FC, hoist: true  },
  { name: "🆓 Free Member",      color: 0xA0AEC0, hoist: false },
  { name: "🎮 PC Gamer",         color: 0x68D391, hoist: false },
  { name: "📱 Mobile Gamer",     color: 0xF6AD55, hoist: false },
  { name: "📺 TV Gamer",         color: 0xFC8181, hoist: false },
  { name: "🏆 Tournament Champ", color: 0xFBBF24, hoist: false },
  { name: "🐛 Bug Hunter",       color: 0x34D399, hoist: false },
];

const STRUCTURE = [
  {
    category: "WELCOME & INFO",
    channels: [
      { name: "welcome",       type: TEXT, topic: "First stop for new members — rules, intro, and what TrueCloud is all about.", readonly: true },
      { name: "announcements", type: NEWS, topic: "Official news: launches, maintenance, updates, and promotions.", readonly: true },
      { name: "rules",         type: TEXT, topic: "Community guidelines. Read before participating.", readonly: true },
      { name: "faq",           type: TEXT, topic: "Answers to the most common questions about our platform.", readonly: true },
      { name: "roles",         type: TEXT, topic: "Self-assign roles for your platform, interests, and notifications." },
    ],
  },
  {
    category: "COMMUNITY",
    channels: [
      { name: "general",        type: TEXT, topic: "Hang out, chat about anything and everything." },
      { name: "introductions",  type: TEXT, topic: "New here? Tell us who you are and what you play!" },
      { name: "off-topic",      type: TEXT, topic: "Memes, life stuff, random — if it doesn't fit elsewhere, put it here." },
      { name: "media-showcase", type: TEXT, topic: "Share screenshots, clips, and highlights from your cloud gaming sessions." },
    ],
  },
  {
    category: "GAMING",
    channels: [
      { name: "game-recommendations", type: TEXT, topic: "What should I play? Share and discover new titles." },
      { name: "looking-for-group",    type: TEXT, topic: "Find teammates or co-op partners for any game." },
      { name: "game-news",            type: TEXT, topic: "Latest releases, patches, and gaming industry news." },
      { name: "tournaments",          type: TEXT, topic: "TrueCloud-hosted events, tournaments, and community challenges." },
    ],
  },
  {
    category: "TRUECLOUD PLATFORM",
    channels: [
      { name: "platform-feedback", type: TEXT, topic: "Suggestions and ideas to improve TrueCloud." },
      { name: "bug-reports",       type: TEXT, topic: "Report issues you encounter. Use the pinned template." },
      { name: "performance-tips",  type: TEXT, topic: "Share settings, configs, and tricks to optimize your stream." },
      { name: "device-help",       type: TEXT, topic: "Platform-specific help: PC, mobile, TV, browser." },
    ],
  },
  {
    category: "SUPPORT",
    channels: [
      { name: "open-a-ticket",   type: TEXT, topic: "Need help? Start here to open a support ticket with our team." },
      { name: "account-billing", type: TEXT, topic: "Questions about your subscription, payments, or account." },
      { name: "tech-support",    type: TEXT, topic: "Connection issues, lag, errors — get technical help here." },
    ],
  },
  {
    category: "VOICE LOUNGES",
    channels: [
      { name: "Gaming Lounge 🎮", type: VOICE },
      { name: "Chill Zone ☁️",   type: VOICE },
      { name: "Squad Up 🤝",     type: VOICE },
    ],
  },
  {
    category: "STAFF",
    staffOnly: true,
    channels: [
      { name: "staff-announcements", type: TEXT, topic: "Internal staff updates." },
      { name: "mod-log",             type: TEXT, topic: "Moderation action log." },
      { name: "staff-chat",          type: TEXT, topic: "Staff coordination and discussion." },
      { name: "Staff Room 🔒",       type: VOICE },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function apiCall(fn, label) {
  try {
    const result = await fn();
    console.log(`   ✔ ${label}`);
    await sleep(300); // avoid rate limits
    return result;
  } catch (e) {
    console.error(`   ✘ ${label} — ${e.message}`);
    throw e;
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

  console.log("\n🚀 Starting TrueCloud server setup (REST only)...\n");

  // 1. Fetch guild info (to get @everyone role ID)
  const guild = await rest.get(Routes.guild(GUILD_ID));
  const everyoneId = guild.id; // @everyone role ID always equals the guild ID

  // 2. Create roles
  console.log("📦 Creating roles...");
  const roleMap = {};
  for (const r of ROLES) {
    const role = await apiCall(
      () => rest.post(Routes.guildRoles(GUILD_ID), {
        body: { name: r.name, color: r.color, hoist: r.hoist, mentionable: false },
      }),
      `Role: ${r.name}`
    );
    roleMap[r.name] = role.id;
  }

  const staffRoleId = roleMap["☁️ TrueCloud Team"];
  const modRoleId   = roleMap["🛡️ Moderator"];

  // 3. Create categories & channels
  console.log("\n📂 Creating categories and channels...");
  for (const section of STRUCTURE) {
    const categoryPerms = section.staffOnly
      ? [
          { id: everyoneId,  deny: String(PermissionFlagsBits.ViewChannel), type: 0 },
          { id: staffRoleId, allow: String(PermissionFlagsBits.ViewChannel), type: 0 },
          { id: modRoleId,   allow: String(PermissionFlagsBits.ViewChannel), type: 0 },
        ]
      : [];

    const category = await apiCall(
      () => rest.post(Routes.guildChannels(GUILD_ID), {
        body: { name: section.category, type: CATEGORY, permission_overwrites: categoryPerms },
      }),
      `📁 ${section.category}`
    );

    for (const ch of section.channels) {
      const chPerms = [...categoryPerms];

      if (ch.readonly) {
        chPerms.push({
          id: everyoneId,
          deny: String(PermissionFlagsBits.SendMessages),
          allow: String(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ReadMessageHistory),
          type: 0,
        });
      }

      await apiCall(
        () => rest.post(Routes.guildChannels(GUILD_ID), {
          body: {
            name: ch.name,
            type: ch.type,
            parent_id: category.id,
            topic: ch.topic || undefined,
            permission_overwrites: chPerms.length ? chPerms : undefined,
          },
        }),
        `${ch.type === VOICE ? "🔊" : "#"} ${ch.name}`
      );
    }
  }

  console.log("\n🎉 TrueCloud server setup complete!");
  console.log("👉 Go to: Server Settings → Server Template → Generate Template Link\n");
}

main().catch(e => {
  console.error("❌ Fatal error:", e.message);
  process.exit(1);
});];

const STRUCTURE = [
  {
    category: "WELCOME & INFO",
    channels: [
      { name: "welcome",       type: ChannelType.GuildText,  topic: "First stop for new members — rules, intro, and what TrueCloud is all about.", readonly: true  },
      { name: "announcements", type: ChannelType.GuildAnnouncement, topic: "Official news: launches, maintenance, updates, and promotions.", readonly: true  },
      { name: "rules",         type: ChannelType.GuildText,  topic: "Community guidelines. Read before participating.",  readonly: true  },
      { name: "faq",           type: ChannelType.GuildText,  topic: "Answers to the most common questions about our platform.", readonly: true  },
      { name: "roles",         type: ChannelType.GuildText,  topic: "Self-assign roles for your platform, interests, and notifications.", readonly: false },
    ],
  },
  {
    category: "COMMUNITY",
    channels: [
      { name: "general",           type: ChannelType.GuildText, topic: "Hang out, chat about anything and everything." },
      { name: "introductions",     type: ChannelType.GuildText, topic: "New here? Tell us who you are and what you play!" },
      { name: "off-topic",         type: ChannelType.GuildText, topic: "Memes, life stuff, random — if it doesn't fit elsewhere, put it here." },
      { name: "media-showcase",    type: ChannelType.GuildText, topic: "Share screenshots, clips, and highlights from your cloud gaming sessions." },
    ],
  },
  {
    category: "GAMING",
    channels: [
      { name: "game-recommendations", type: ChannelType.GuildText, topic: "What should I play? Share and discover new titles." },
      { name: "looking-for-group",    type: ChannelType.GuildText, topic: "Find teammates or co-op partners for any game." },
      { name: "game-news",            type: ChannelType.GuildText, topic: "Latest releases, patches, and gaming industry news." },
      { name: "tournaments",          type: ChannelType.GuildText, topic: "TrueCloud-hosted events, tournaments, and community challenges." },
    ],
  },
  {
    category: "TRUECLOUD PLATFORM",
    channels: [
      { name: "platform-feedback", type: ChannelType.GuildText, topic: "Suggestions and ideas to improve TrueCloud." },
      { name: "bug-reports",       type: ChannelType.GuildText, topic: "Report issues you encounter. Use the pinned template." },
      { name: "performance-tips",  type: ChannelType.GuildText, topic: "Share settings, configs, and tricks to optimize your stream." },
      { name: "device-help",       type: ChannelType.GuildText, topic: "Platform-specific help: PC, mobile, TV, browser." },
    ],
  },
  {
    category: "SUPPORT",
    channels: [
      { name: "open-a-ticket",   type: ChannelType.GuildText, topic: "Need help? Start here to open a support ticket with our team." },
      { name: "account-billing", type: ChannelType.GuildText, topic: "Questions about your subscription, payments, or account." },
      { name: "tech-support",    type: ChannelType.GuildText, topic: "Connection issues, lag, errors — get technical help here." },
    ],
  },
  {
    category: "VOICE LOUNGES",
    channels: [
      { name: "Gaming Lounge 🎮", type: ChannelType.GuildVoice },
      { name: "Chill Zone ☁️",   type: ChannelType.GuildVoice },
      { name: "Squad Up 🤝",     type: ChannelType.GuildVoice },
    ],
  },
  {
    category: "STAFF",
    staffOnly: true,
    channels: [
      { name: "staff-announcements", type: ChannelType.GuildText, topic: "Internal staff updates." },
      { name: "mod-log",             type: ChannelType.GuildText, topic: "Moderation action log." },
      { name: "staff-chat",          type: ChannelType.GuildText, topic: "Staff coordination and discussion." },
      { name: "Staff Room 🔒",       type: ChannelType.GuildVoice },
    ],
  },
];

// ── Bot Logic ────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`\n✅ Logged in as ${client.user.tag}`);
  console.log("🚀 Starting TrueCloud server setup...\n");

  const guild = await client.guilds.fetch(GUILD_ID);

  // 1. Create Roles
  console.log("📦 Creating roles...");
  const roleMap = {};
  for (const r of ROLES) {
    const role = await guild.roles.create({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      reason: "TrueCloud setup",
    });
    roleMap[r.name] = role;
    console.log(`   ✔ Role: ${r.name}`);
  }

  const staffRole = roleMap["☁️ TrueCloud Team"];
  const modRole   = roleMap["🛡️ Moderator"];

  // 2. Create Categories & Channels
  console.log("\n📂 Creating categories and channels...");
  for (const section of STRUCTURE) {
    // Create category
    const permissionOverwrites = [];

    if (section.staffOnly) {
      // Deny everyone, allow staff + mods
      permissionOverwrites.push(
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: modRole.id,   allow: [PermissionFlagsBits.ViewChannel] },
      );
    }

    const category = await guild.channels.create({
      name: section.category,
      type: ChannelType.GuildCategory,
      permissionOverwrites,
      reason: "TrueCloud setup",
    });
    console.log(`\n   📁 ${section.category}`);

    for (const ch of section.channels) {
      const chPerms = [...permissionOverwrites];

      // Readonly channels: everyone can read but not send
      if (ch.readonly) {
        chPerms.push({
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.SendMessages],
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        });
      }

      await guild.channels.create({
        name: ch.name,
        type: ch.type,
        parent: category.id,
        topic: ch.topic || undefined,
        permissionOverwrites: chPerms.length ? chPerms : undefined,
        reason: "TrueCloud setup",
      });
      const icon = ch.type === ChannelType.GuildVoice ? "🔊" : "#";
      console.log(`      ${icon} ${ch.name}`);
    }
  }

  console.log("\n🎉 TrueCloud server setup complete!");
  console.log("👉 Next step: Server Settings → Server Template → Generate Template Link\n");
  client.destroy();
});

client.login(BOT_TOKEN);
