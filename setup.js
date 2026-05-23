// ============================================================
//  TrueCloud Discord Server Setup Bot
//  Automatically creates all categories, channels & roles
// ============================================================
//
//  SETUP INSTRUCTIONS:
//  1. Go to https://discord.com/developers/applications
//  2. Create a New Application → go to "Bot" → copy the Token
//  3. Under "Bot", enable: SERVER MEMBERS INTENT + MESSAGE CONTENT INTENT
//  4. Go to OAuth2 → URL Generator:
//       Scopes: bot
//       Bot Permissions: Administrator
//  5. Open the generated URL, invite the bot to YOUR server
//  6. Run:  npm install discord.js
//  7. Paste your Bot Token and Server (Guild) ID below
//  8. Run:  node setup.js
// ============================================================

const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require("discord.js");

const BOT_TOKEN = "MTUwNzYzMDc2NTgwNTAxMDk3NA.GoWsIt.H3QSzNE_AgRXM8mgY0DALGdslaicFYT9Un7h_0";
const GUILD_ID  = "1507630883794849884";   // Right-click server → Copy Server ID

// ── Server Structure ─────────────────────────────────────────

const ROLES = [
  { name: "☁️ TrueCloud Team",    color: "#00CFFF", hoist: true,  position: 10 },
  { name: "🛡️ Moderator",         color: "#7289DA", hoist: true,  position: 9  },
  { name: "💎 TrueCloud Pro",      color: "#FFD700", hoist: true,  position: 8  },
  { name: "🌟 TrueCloud Plus",     color: "#C084FC", hoist: true,  position: 7  },
  { name: "🆓 Free Member",        color: "#A0AEC0", hoist: false, position: 6  },
  { name: "🎮 PC Gamer",           color: "#68D391", hoist: false, position: 5  },
  { name: "📱 Mobile Gamer",       color: "#F6AD55", hoist: false, position: 4  },
  { name: "📺 TV Gamer",           color: "#FC8181", hoist: false, position: 3  },
  { name: "🏆 Tournament Champ",   color: "#FBBF24", hoist: false, position: 2  },
  { name: "🐛 Bug Hunter",         color: "#34D399", hoist: false, position: 1  },
];

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
