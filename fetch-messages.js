const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log('Bot bağlandı, son mesajları çekiyor...');

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 10 });

    for (const message of messages.values()) {
      if (message.author.bot) continue;

      const { data: existing } = await supabase
        .from('announcements')
        .select('id')
        .eq('content', message.content)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('Zaten kayıtlı, atla:', message.content);
        continue;
      }

      const { error } = await supabase
        .from('announcements')
        .insert([{ content: message.content, author: message.author.username }]);

      if (error) {
        console.error('Kayıt hatası:', error.message);
      } else {
        console.log('Yeni mesaj kaydedildi:', message.content);
      }
    }

    console.log('Mesaj çekme tamamlandı.');
  } catch (err) {
    console.error('Hata:', err.message);
  }

  client.destroy();
});

client.login(DISCORD_TOKEN);