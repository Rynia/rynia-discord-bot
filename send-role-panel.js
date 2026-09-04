const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const ROLES_CHANNEL_ID = '1488903578532712578';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log(`Bot baglandi: ${client.user.tag}`);
  const channel = await client.channels.fetch(ROLES_CHANNEL_ID);
  if (!channel) {
    console.error('Kanal bulunamadi!');
    process.exit(1);
  }

  // Temizlik: eski mesajları sil
  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    for (const msg of messages.values()) {
      await msg.delete();
    }
  } catch (e) {
    console.warn('Mesaj temizleme atlaniyor:', e.message);
  }

  const embed = new EmbedBuilder()
    .setColor(0x6366F1)
    .setTitle('🎭 Rynia Studios — Rol & Bildirim Paneli')
    .setDescription(
      'Aşağıdaki butonlara tıklayarak sunucudaki ilgi alanlarınıza göre rollerinizi alabilir, dilediğinizde tekrar basarak rolü bırakabilirsiniz.\n\n' +
      '**🛠️ Builder / Developer**\n' +
      '> *Yazılım geliştiren, kodlama veya tasarımla uğraşan, kendi projelerini inşa eden üreticiler.*\n\n' +
      '**🎮 Gamer / Strategist**\n' +
      '> *Oyun mekanikleri, taktiksel kart sistemleri ve oyun dünyasıyla ilgilenen oyuncular.*\n\n' +
      '**📢 Announcement Ping**\n' +
      '> *Yeni ürün lansmanları, büyük stüdyo kilometre taşları ve ana duyurulardan haberdar olmak için.*\n\n' +
      '**🔬 Devlog Ping**\n' +
      '> *Haftalık teknik geliştirme notları, yapay zeka deneyleri ve mutfak arkası paylaşımları için.*\n\n' +
      '**🧪 Playtest Ping**\n' +
      '> *Kombo Kart veya diğer sistemlerin yeni test sürümleri çıktığında ilk deneyenlerden olmak için.*\n\n' +
      '──────────────────────────────────────\n' +
      'ℹ️ *İpucu: Butona tekrar tıkladığınızda rol üzerinizden geri alınır.*'
    )
    .setFooter({ text: 'Rynia Studios • Topluluk Rol Sistemi' });

  // Row 1: Topluluk Rolleri
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('role_builder')
      .setLabel('Builder / Developer')
      .setEmoji('🛠️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('role_gamer')
      .setLabel('Gamer / Strategist')
      .setEmoji('🎮')
      .setStyle(ButtonStyle.Primary)
  );

  // Row 2: Bildirim Rolleri
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('role_announcements')
      .setLabel('Duyuru Bildirimi')
      .setEmoji('📢')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('role_devlog')
      .setLabel('Devlog Bildirimi')
      .setEmoji('🔬')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('role_playtest')
      .setLabel('Playtest Bildirimi')
      .setEmoji('🧪')
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({
    embeds: [embed],
    components: [row1, row2]
  });

  console.log('[OK] Butonlu Rol Paneli basariyla gonderildi!');
  client.destroy();
  process.exit(0);
});

client.login(token);
