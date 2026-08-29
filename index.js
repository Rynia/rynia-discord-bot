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

client.login(DISCORD_TOKEN);