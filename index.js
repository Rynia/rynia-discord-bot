const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

client.once('ready', () => {
  console.log(`Bot hazır: ${client.user.tag}`);
  console.log(`Kanal ID: ${CHANNEL_ID}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  const { data, error } = await supabase
    .from('announcements')
    .insert([
      {
        content: message.content,
        author: message.author.username
      }
    ]);

  if (error) {
    console.error('Supabase hatası:', error.message);
  } else {
    console.log('Mesaj kaydedildi:', message.content);
  }
});

// Role Button Mapping
const ROLE_BUTTON_MAP = {
  role_builder: '1545364680120209499',       // 🛠️ Builder / Developer
  role_gamer: '1545364681823227965',         // 🎮 Gamer / Strategist
  role_announcements: '1545364683400286231', // 📢 Announcement Ping
  role_devlog: '1545364686885748746',        // 🔬 Devlog Ping
  role_playtest: '1545364688865333258'       // 🧪 Playtest Ping
};

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const roleId = ROLE_BUTTON_MAP[interaction.customId];
  if (!roleId) return;

  try {
    const role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId);
    if (!role) {
      return interaction.reply({ content: 'Rol sunucuda bulunamadı.', ephemeral: true });
    }

    const member = interaction.member;
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      return interaction.reply({ 
        content: `❌ **${role.name}** rolü üzerinden kaldırıldı.`, 
        ephemeral: true 
      });
    } else {
      await member.roles.add(roleId);
      return interaction.reply({ 
        content: `✅ **${role.name}** rolü başarıyla verildi!`, 
        ephemeral: true 
      });
    }
  } catch (err) {
    console.error('Rol verme hatası:', err);
    return interaction.reply({ 
      content: 'Rol atanırken bir hata oluştu. Lütfen botun rol yetkilerini kontrol edin.', 
      ephemeral: true 
    });
  }
});

client.login(DISCORD_TOKEN);