// ============================================================
//  TrueCloud Discord Server Setup — zero dependencies
//  Uses built-in fetch (Node 18+, which Railway uses by default)
// ============================================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID  = process.env.GUILD_ID;

if (!BOT_TOKEN || !GUILD_ID) {
  console.error("❌ Missing BOT_TOKEN or GUILD_ID environment variables.");
  process.exit(1);
}

const BASE = "https://discord.com/api/v10";
const HEADERS = {
  "Authorization": `Bot ${BOT_TOKEN}`,
  "Content-Type": "application/json",
};

// Channel types
const TEXT     = 0;
const VOICE    = 2;
const CATEGORY = 4;
const NEWS     = 5;

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
      { name: "welcome",       type: TEXT, topic: "First stop for new members.", readonly: true },
      { name: "announcements", type: NEWS, topic: "Official news and updates.",  readonly: true },
      { name: "rules",         type: TEXT, topic: "Community guidelines.",       readonly: true },
      { name: "faq",           type: TEXT, topic: "Common questions answered.",  readonly: true },
      { name: "roles",         type: TEXT, topic: "Self-assign your roles." },
    ],
  },
  {
    category: "COMMUNITY",
    channels: [
      { name: "general",        type: TEXT, topic: "General chat." },
      { name: "introductions",  type: TEXT, topic: "Introduce yourself!" },
      { name: "off-topic",      type: TEXT, topic: "Anything goes." },
      { name: "media-showcase", type: TEXT, topic: "Share your gaming clips." },
    ],
  },
  {
    category: "GAMING",
    channels: [
      { name: "game-recommendations", type: TEXT, topic: "What should I play?" },
      { name: "looking-for-group",    type: TEXT, topic: "Find teammates." },
      { name: "game-news",            type: TEXT, topic: "Latest gaming news." },
      { name: "tournaments",          type: TEXT, topic: "TrueCloud events and tournaments." },
    ],
  },
  {
    category: "TRUECLOUD PLATFORM",
    channels: [
      { name: "platform-feedback", type: TEXT, topic: "Suggestions for TrueCloud." },
      { name: "bug-reports",       type: TEXT, topic: "Report bugs here." },
      { name: "performance-tips",  type: TEXT, topic: "Optimize your stream." },
      { name: "device-help",       type: TEXT, topic: "PC, mobile, TV, browser help." },
    ],
  },
  {
    category: "SUPPORT",
    channels: [
      { name: "open-a-ticket",   type: TEXT, topic: "Start a support ticket." },
      { name: "account-billing", type: TEXT, topic: "Subscription and billing questions." },
      { name: "tech-support",    type: TEXT, topic: "Technical issues and fixes." },
    ],
  },
  {
    category: "VOICE LOUNGES",
    channels: [
      { name: "Gaming Lounge",  type: VOICE },
      { name: "Chill Zone",     type: VOICE },
      { name: "Squad Up",       type: VOICE },
    ],
  },
  {
    category: "STAFF",
    staffOnly: true,
    channels: [
      { name: "staff-announcements", type: TEXT, topic: "Internal staff updates." },
      { name: "mod-log",             type: TEXT, topic: "Moderation action log." },
      { name: "staff-chat",          type: TEXT, topic: "Staff coordination." },
      { name: "Staff Room",          type: VOICE },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429) {
    const data = await res.json();
    console.log(`   ⏳ Rate limited — waiting ${data.retry_after}s`);
    await sleep(data.retry_after * 1000 + 200);
    return api(method, path, body); // retry
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${path} — ${err}`);
  }
  return res.json();
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 TrueCloud server setup starting...\n");

  // Verify token works
  const me = await api("GET", "/users/@me");
  console.log(`✅ Logged in as: ${me.username}\n`);

  const everyoneId = GUILD_ID; // @everyone role ID = guild ID

  // 1. Create roles
  console.log("📦 Creating roles...");
  const roleMap = {};
  for (const r of ROLES) {
    const role = await api("POST", `/guilds/${GUILD_ID}/roles`, {
      name: r.name, color: r.color, hoist: r.hoist, mentionable: false,
    });
    roleMap[r.name] = role.id;
    console.log(`   ✔ ${r.name}`);
    await sleep(300);
  }

  const staffRoleId = roleMap["☁️ TrueCloud Team"];
  const modRoleId   = roleMap["🛡️ Moderator"];

  // 2. Create categories & channels
  console.log("\n📂 Creating categories and channels...");
  for (const section of STRUCTURE) {
    const DENY_VIEW  = "1024";
    const ALLOW_VIEW = "1024";

    const categoryPerms = section.staffOnly ? [
      { id: everyoneId,  deny: DENY_VIEW,  type: 0 },
      { id: staffRoleId, allow: ALLOW_VIEW, type: 0 },
      { id: modRoleId,   allow: ALLOW_VIEW, type: 0 },
    ] : [];

    const category = await api("POST", `/guilds/${GUILD_ID}/channels`, {
      name: section.category,
      type: CATEGORY,
      permission_overwrites: categoryPerms,
    });
    console.log(`\n   📁 ${section.category}`);
    await sleep(300);

    for (const ch of section.channels) {
      const chPerms = [...categoryPerms];
      if (ch.readonly) {
        chPerms.push({
          id: everyoneId,
          deny: "2048",   // SEND_MESSAGES
          allow: "65536", // READ_MESSAGE_HISTORY
          type: 0,
        });
      }

      await api("POST", `/guilds/${GUILD_ID}/channels`, {
        name: ch.name,
        type: ch.type,
        parent_id: category.id,
        ...(ch.topic ? { topic: ch.topic } : {}),
        ...(chPerms.length ? { permission_overwrites: chPerms } : {}),
      });
      console.log(`      ${ch.type === VOICE ? "🔊" : "#"} ${ch.name}`);
      await sleep(300);
    }
  }

  console.log("\n🎉 Done! All channels and roles created.");
  console.log("👉 Server Settings → Server Template → Generate Template Link\n");
}

main().catch(e => {
  console.error("❌ Fatal:", e.message);
  process.exit(1);
});tings, configs, and tricks to optimize your stream." },
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
