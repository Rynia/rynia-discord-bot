const { 
  Client, 
  GatewayIntentBits, 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder 
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID || '1488865375859773681';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Critical channels to KEEP
const KEEP_CHANNEL_IDS = {
  announcements: '1488869912163258408',
  whatIsRynia: '1537254208552566814',
  roles: '1488903578532712578',
  generalChat: '1488869935735246989',
  showcase: '1490020443338444921',
  devLog: '1488869292748443699',
  komboKart: '1535820748814295132'
};

async function setup() {
  console.log('>>> Rynia Studios Discord Mimarisi Kurulumu Basliyor...');
  const guild = await client.guilds.fetch(GUILD_ID);
  console.log(`Baglanilan Sunucu: ${guild.name}`);

  const everyoneRole = guild.roles.everyone;

  // 1. ROLES MANAGEMENT
  console.log('\n[1/4] Roller yapilandiriliyor...');
  const existingRoles = await guild.roles.fetch();

  // Find or create Founder role
  let founderRole = existingRoles.find(r => r.name.includes('Founder'));
  if (!founderRole) {
    founderRole = await guild.roles.create({
      name: '👑 Founder',
      color: 0xE5A93C,
      hoist: true,
      permissions: [PermissionFlagsBits.Administrator]
    });
  }

  // Desired Lean Roles
  const rolesToEnsure = [
    { name: '👑 Founder', color: 0xE5A93C, hoist: true, mentionable: false },
    { name: '🧠 Core Contributor', color: 0x6366F1, hoist: true, mentionable: true },
    { name: '🛡️ Moderator', color: 0x3B82F6, hoist: true, mentionable: true },
    { name: '🧪 Beta Tester', color: 0x10B981, hoist: true, mentionable: true },
    { name: '🌟 Early Supporter', color: 0xF59E0B, hoist: true, mentionable: false },
    { name: '🛠️ Builder / Developer', color: 0x8B5CF6, hoist: false, mentionable: false },
    { name: '🎮 Gamer / Strategist', color: 0xEC4899, hoist: false, mentionable: false },
    { name: '✅ Verified', color: 0x94A3B8, hoist: false, mentionable: false },
    // Notification roles
    { name: '📢 Announcement Ping', color: 0xCBD5E1, hoist: false, mentionable: true },
    { name: '🔬 Devlog Ping', color: 0xCBD5E1, hoist: false, mentionable: true },
    { name: '🧪 Playtest Ping', color: 0xCBD5E1, hoist: false, mentionable: true }
  ];

  const roleObjects = {};
  for (const rDef of rolesToEnsure) {
    let role = existingRoles.find(r => r.name.toLowerCase() === rDef.name.toLowerCase());
    if (!role) {
      console.log(`  + Yeni rol olusturuluyor: ${rDef.name}`);
      try {
        role = await guild.roles.create({
          name: rDef.name,
          color: rDef.color,
          hoist: rDef.hoist,
          mentionable: rDef.mentionable
        });
      } catch (err) {
        console.warn(`  ! Rol olusturulamadi (${rDef.name}): ${err.message}`);
      }
    } else {
      console.log(`  = Mevcut rol bulundu: ${role.name}`);
    }
    if (role) roleObjects[rDef.name] = role;
  }

  // Delete redundant old AAA roles if bot has permission
  const rolesToDeletePatterns = [
    'gameplay systems', 'ai systems', 'level design', 'game economy', 
    'networking', 'optimization', 'tools dev', 'game designer',
    'developer', 'artist', 'ui/ux designer', 'sound designer', 'writer',
    'bug hunter', 'feedback hero', 'contributor', 'active member',
    'c#', 'c++', 'python', 'javascript', 'unity', 'unreal',
    'fps', 'rpg', 'indie', 'competitive', 'sandbox',
    '-----------'
  ];

  const botMember = await guild.members.fetchMe();
  const botHighestPos = botMember.roles.highest.position;

  for (const [id, r] of existingRoles) {
    if (r.position >= botHighestPos || r.id === everyoneRole.id) continue;
    const lower = r.name.toLowerCase();
    const shouldDelete = rolesToDeletePatterns.some(p => lower.includes(p));
    if (shouldDelete) {
      try {
        await r.delete('Yalin mimariye gecis - eski gereksiz rol temizligi');
        console.log(`  - Eski rol silindi: ${r.name}`);
      } catch (err) {
        console.warn(`  ! Rol silinemedi (${r.name}): ${err.message}`);
      }
    }
  }

  // 2. CHANNELS CLEANUP & RESTRUCTURING
  console.log('\n[2/4] Eski gereksiz kanallar temizleniyor (Secenek A)...');
  const allChannels = await guild.channels.fetch();
  const keepIdsList = Object.values(KEEP_CHANNEL_IDS);

  for (const [id, ch] of allChannels) {
    if (!ch) continue;
    if (keepIdsList.includes(ch.id)) continue;

    try {
      await ch.delete('Yalin mimariye gecis (Secenek A)');
      console.log(`  - Silindi: ${ch.name}`);
    } catch (err) {
      console.warn(`  ! Kanal silinemedi (${ch.name}): ${err.message}`);
    }
  }

  // 3. CREATE NEW LEAN CATEGORIES & CHANNELS
  console.log('\n[3/4] Yeni kategoriler ve kanallar insa ediliyor...');
  const betaTesterRole = roleObjects['🧪 Beta Tester'] || existingRoles.find(r => r.name.includes('Tester'));

  // Category 00: RADAR
  const catRadar = await guild.channels.create({
    name: '🏛️ 00 — RADAR',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
      },
      {
        id: founderRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
      }
    ]
  });

  const announcementsCh = await guild.channels.fetch(KEEP_CHANNEL_IDS.announcements);
  if (announcementsCh) {
    await announcementsCh.setParent(catRadar.id, { lockPermissions: false });
    await announcementsCh.setName('📢・announcements');
    await announcementsCh.permissionOverwrites.set([
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages]
      },
      {
        id: founderRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
      }
    ]);
    console.log('  + announcements kanali Radar kategorisine baglandi.');
  }

  const whatIsRyniaCh = await guild.channels.fetch(KEEP_CHANNEL_IDS.whatIsRynia);
  if (whatIsRyniaCh) {
    await whatIsRyniaCh.setParent(catRadar.id, { lockPermissions: false });
    await whatIsRyniaCh.setName('⚡・what-is-rynia');
    await whatIsRyniaCh.permissionOverwrites.set([
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages]
      },
      {
        id: founderRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
      }
    ]);
    console.log('  + what-is-rynia kanali Radar kategorisine baglandi.');
  }

  const roadmapCh = await guild.channels.create({
    name: '🗺️・roadmap-status',
    type: ChannelType.GuildText,
    parent: catRadar.id,
    topic: 'Kiler // Kitchen OS ve Kombo Kart stüdyo yol haritası ve canlı aşamalar.',
    permissionOverwrites: [
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages]
      },
      {
        id: founderRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
      }
    ]
  });
  console.log('  + roadmap-status kanali olusturuldu.');

  const rolesCh = await guild.channels.fetch(KEEP_CHANNEL_IDS.roles);
  if (rolesCh) {
    await rolesCh.setParent(catRadar.id, { lockPermissions: false });
    await rolesCh.setName('🎭・roles');
    await rolesCh.permissionOverwrites.set([
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages]
      },
      {
        id: founderRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
      }
    ]);
    console.log('  + roles kanali Radar kategorisine baglandi.');
  }

  // Category 01: COMMONS
  const catCommons = await guild.channels.create({
    name: '💬 01 — COMMONS',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: everyoneRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel, 
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AddReactions
        ]
      }
    ]
  });

  const generalCh = await guild.channels.fetch(KEEP_CHANNEL_IDS.generalChat);
  if (generalCh) {
    await generalCh.setParent(catCommons.id, { lockPermissions: true });
    await generalCh.setName('💬・general-chat');
    console.log('  + general-chat kanali Commons kategorisine baglandi.');
  }

  const ideasCh = await guild.channels.create({
    name: '💡・ideas-feedback',
    type: ChannelType.GuildText,
    parent: catCommons.id,
    topic: 'Ürünlerimiz, oyunlarımız ve yeni sistemler için topluluk öneri ve fikir alanı.'
  });
  console.log('  + ideas-feedback kanali olusturuldu.');

  const showcaseCh = await guild.channels.fetch(KEEP_CHANNEL_IDS.showcase);
  if (showcaseCh) {
    await showcaseCh.setParent(catCommons.id, { lockPermissions: true });
    await showcaseCh.setName('✨・showcase');
    console.log('  + showcase kanali Commons kategorisine baglandi.');
  }

  // Category 02: RYNIA LABS
  const catLabs = await guild.channels.create({
    name: '🔬 02 — RYNIA LABS',
    type: ChannelType.GuildCategory
  });

  const devLogCh = await guild.channels.fetch(KEEP_CHANNEL_IDS.devLog);
  if (devLogCh) {
    await devLogCh.setParent(catLabs.id, { lockPermissions: false });
    await devLogCh.setName('📝・dev-log');
    await devLogCh.permissionOverwrites.set([
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
        deny: [PermissionFlagsBits.SendMessages]
      },
      {
        id: founderRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
      }
    ]);
    console.log('  + dev-log kanali Rynia Labs kategorisine baglandi.');
  }

  const kilerCh = await guild.channels.create({
    name: '📦・kiler-kitchen-os',
    type: ChannelType.GuildText,
    parent: catLabs.id,
    topic: 'Kiler // Kitchen OS: Akıllı tüketim & israf önleme motoru geliştirme ve tartışma odası.'
  });
  console.log('  + kiler-kitchen-os kanali olusturuldu.');

  const komboKartCh = await guild.channels.fetch(KEEP_CHANNEL_IDS.komboKart);
  if (komboKartCh) {
    await komboKartCh.setParent(catLabs.id, { lockPermissions: true });
    await komboKartCh.setName('🃏・kombo-kart');
    console.log('  + kombo-kart kanali Rynia Labs kategorisine baglandi.');
  }

  const playtestVaultCh = await guild.channels.create({
    name: '🧪・playtest-vault',
    type: ChannelType.GuildText,
    parent: catLabs.id,
    topic: 'Sadece Beta Tester ve Early Supporter üyeler için erken test sürümleri ve hata raporlama.',
    permissionOverwrites: [
      {
        id: everyoneRole.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      ...(betaTesterRole ? [{
        id: betaTesterRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      }] : []),
      {
        id: founderRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.Administrator
        ]
      }
    ]
  });
  console.log('  + playtest-vault ozel kanali olusturuldu.');

  // Category 03: FOUNDER VAULT
  const catVault = await guild.channels.create({
    name: '🔒 03 — FOUNDER VAULT',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: everyoneRole.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: founderRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.Administrator
        ]
      }
    ]
  });

  const founderDeskCh = await guild.channels.create({
    name: '🧠・founder-desk',
    type: ChannelType.GuildText,
    parent: catVault.id,
    topic: 'Kurucunun özel çalışma masası, karar defteri ve taslaklar.'
  });
  console.log('  + founder-desk ozel kanali olusturuldu.');

  // 4. POST RICH EMBEDS TO CHANNELS
  console.log('\n[4/4] Manifesto ve rehber embedleri gonderiliyor...');

  if (whatIsRyniaCh) {
    const manifestoEmbed = new EmbedBuilder()
      .setColor(0x0D0D11)
      .setTitle('⚡ Rynia Studios — Independent Developer Studio')
      .setDescription(
        '**Fikirleri Çalışan Sistemlere Dönüştürüyoruz.**\n\n' +
        'Rynia Studios; yazılım, pratik dijital araçlar ve derinlikli oyun sistemleri inşa eden bağımsız bir solo geliştirici stüdyosudur. Yapay zekayı bir düşünce ve tasarım ortağı olarak kullanır, her projeye aynı mühendislik disiplini ve sabırla yaklaşırız.\n\n' +
        '🌐 **Resmi Vitrin:** https://ryniastudios.netlify.app\n\n' +
        '**📌 Temel Prensiplerimiz:**\n' +
        '• **Disiplin:** Büyük vaatler yerine her gün çalışan küçük adımlar.\n' +
        '• **Şeffaflık:** Yapay zeka ortaklığıyla geliştirme sürecini dürüstçe toplulukla paylaşmak.\n' +
        '• **İterasyon:** Hatalardan ders çıkararak sistemleri sürekli iyileştirmek.\n\n' +
        `Topluluğumuza hoş geldin! Sohbet etmek için <#${KEEP_CHANNEL_IDS.generalChat}> kanalına geçebilirsin.`
      )
      .setFooter({ text: 'Rynia Studios • Crafted with discipline' });

    await whatIsRyniaCh.send({ embeds: [manifestoEmbed] });
    console.log('  + #what-is-rynia embed gonderildi.');
  }

  if (roadmapCh) {
    const roadmapEmbed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('🗺️ Aktif Sistemler & Yol Haritası')
      .setDescription(
        '**1. Kiler // Kitchen OS** [IN PROTOTYPE / DESIGN]\n' +
        '• Akıllı tüketim & israf önleme karar motoru (Web/PWA/Mobil)\n' +
        `• Geliştirme tartışmaları: <#${kilerCh.id}>\n\n` +
        '**2. Kombo Kart** [IN DEVELOPMENT]\n' +
        '• Taktiksel auto-battler mobil kart oyunu\n' +
        `• Geliştirme tartışmaları: <#${KEEP_CHANNEL_IDS.komboKart}>\n\n` +
        '**3. Rynia Labs** [CANLI AR-GE]\n' +
        `• Yapay zeka ve sistem devlog\'ları: <#${KEEP_CHANNEL_IDS.devLog}>\n` +
        `• Erken test sürümleri: <#${playtestVaultCh.id}>`
      )
      .setTimestamp();

    await roadmapCh.send({ embeds: [roadmapEmbed] });
    console.log('  + #roadmap-status embed gonderildi.');
  }

  if (rolesCh) {
    const rolesEmbed = new EmbedBuilder()
      .setColor(0x6366F1)
      .setTitle('🎭 Rynia Studios — Rol & Katkı Alanları')
      .setDescription(
        'Sunucuda ilgilendiğin alanlara göre bildirim almak veya test süreçlerine katılmak için rollerini belirle:\n\n' +
        `🧪 **Beta Tester:** Erken test sürümlerini denemek ve <#${playtestVaultCh.id}> kanalına erişmek için\n` +
        '🛠️ **Builder:** Kodlama, yazılım ve tasarım ile ilgilenen üreticiler\n' +
        '🎮 **Gamer:** Oyun sistemleri ve kart mekanikleri meraklıları\n' +
        '🔔 **Devlog Ping:** Yeni devlog ve teknik güncellemelerde bildirim alırsın\n\n' +
        '*Rolünü almak için sohbet kanalında belirtebilir veya kurucudan talep edebilirsin.*'
      );

    await rolesCh.send({ embeds: [rolesEmbed] });
    console.log('  + #roles embed gonderildi.');
  }

  console.log('\n>>> [TEBRİKLER!] Rynia Studios Discord Sunucusu Basariyla Kuruldu!');
  client.destroy();
  process.exit(0);
}

client.once('ready', () => {
  setup().catch(err => {
    console.error('Kurulum hatasi:', err);
    client.destroy();
    process.exit(1);
  });
});

client.login(token);
