require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  Routes, 
  REST, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GUILD_ID = process.env.GUILD_ID || '1488865375859773681';

// Merkezi Veri Kaynakları (KALANLA)
const releaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'release.json'), 'utf8'));
let recipes = [];
try {
  recipes = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'recipes.json'), 'utf8'));
  // Tek kaynak (Single Source of Truth) kuralı: tarif sayısı dinamik eşitlenir
  releaseConfig.recipeCount = recipes.length;
} catch (e) {
  console.warn('Tarifler okunamadı:', e.message);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Slash Komut Tanımları
const commands = [
  new SlashCommandBuilder()
    .setName('kalanla')
    .setDescription('KALANLA // Kitchen OS Android APK indirme linki ve kurulum rehberi'),

  new SlashCommandBuilder()
    .setName('tarif')
    .setDescription('KALANLA geleneksel bereketli kurtarma tariflerini gösterir')
    .addStringOption(opt => 
      opt.setName('malzeme')
        .setDescription('Aramak istediğin malzeme (patates, un, tavuk, mercimek...)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('hata')
    .setDescription('KALANLA uygulamasında karşılaştığın bir hatayı ekibe bildir')
].map(cmd => cmd.toJSON());

// Slash Komutlarını Guild'e Kaydet
async function registerSlashCommands(clientId) {
  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    console.log('>>> Slash komutları kaydediliyor...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, GUILD_ID),
      { body: commands }
    );
    console.log('>>> Slash komutları başarıyla kaydedildi!');
  } catch (error) {
    console.error('Slash komut kayıt hatası:', error);
  }
}

client.once('ready', async () => {
  console.log(`Bot hazır: ${client.user.tag}`);
  if (CHANNEL_ID) console.log(`Kanal ID: ${CHANNEL_ID}`);
  await registerSlashCommands(client.user.id);
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
  role_playtest: '1545364688865333258',      // 🧪 Playtest Ping
  role_kalanla_tester: 'role_kalanla_tester' // 🍳 KALANLA Tester
};

client.on('interactionCreate', async (interaction) => {
  try {
    // 1. BUTON ETKİLEŞİMLERİ (Rol Alma / Bırakma)
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // KALANLA Tester Rolü Özel Kontrolü (Sunucuda dinamik arar)
      if (customId === 'role_kalanla_tester') {
        const role = interaction.guild.roles.cache.find(r => r.name.includes('KALANLA') || r.name.includes('Tester')) 
          || interaction.guild.roles.cache.find(r => r.name === '🧪 Beta Tester');

        if (!role) {
          return interaction.reply({ content: 'Tester rolü henüz sunucuda tanımlanmamış.', ephemeral: true });
        }

        const member = interaction.member;
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role.id);
          return interaction.reply({ content: `❌ **${role.name}** rolü üzerinden kaldırıldı.`, ephemeral: true });
        } else {
          await member.roles.add(role.id);
          return interaction.reply({ content: `🍳 **${role.name}** rolü verildi! Hoş geldin mutfak şefi.`, ephemeral: true });
        }
      }

      // Genel Rol Butonları
      const roleId = ROLE_BUTTON_MAP[customId];
      if (!roleId) return;

      const role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId).catch(() => null);
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
    }

    // 2. SLASH KOMUTLARI
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      // ── /kalanla ─────────────────────────────────────────
      if (commandName === 'kalanla') {
        const embed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle(`🍳 ${releaseConfig.name} — v${releaseConfig.version}`)
          .setDescription(
            'Dolapta ne kaldıysa çöpe atmak yerine berekete dönüştüren sıfır atık mutfak işletim sistemi!\n\n' +
            `📦 **Katalog:** ${releaseConfig.recipeCount} Bereketli Tarif • ${releaseConfig.pantryItemCount} Kiler Demirbaşı\n` +
            `📅 **Sürüm Tarihi:** ${releaseConfig.releaseDate}\n\n` +
            '**📲 Android Kurulum Adımları:**\n' +
            '1. Aşağıdaki butondan doğrudan APK dosyasını indirin.\n' +
            '2. Telefonda *"Bilinmeyen kaynaklardan yükleme izni"* uyarısı çıkarsa onay verin.\n' +
            '3. Kurulumu tamamlayıp dolabınızı kurtarmaya başlayın!\n\n' +
            '**🍎 iPhone (iOS) Kullanıcıları:**\n' +
            '*KALANLA şu anda Android beta aşamasındadır. iPhone için test etmek isteyenler Expo Go linki alabilir veya ailenizdeki Android cihazlarda deneyebilirsiniz!*'
          )
          .setFooter({ text: 'Rynia Studios • Sıfır Atık Mutfak Hareketi' });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Android APK İndir (v' + releaseConfig.version + ')')
            .setStyle(ButtonStyle.Link)
            .setURL(releaseConfig.apkUrl)
            .setEmoji('📥')
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }

      // ── /tarif ──────────────────────────────────────────
      if (commandName === 'tarif') {
        const query = (interaction.options.getString('malzeme') || '').trim().toLowerCase();

        let matched = recipes;
        if (query) {
          matched = recipes.filter(r => 
            r.title.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query) ||
            (r.ingredients || []).some(i => i.name.toLowerCase().includes(query))
          );
        }

        if (matched.length === 0) {
          return interaction.reply({ 
            content: `🔍 **"${query}"** malzemesiyle doğrudan eşleşen hazır tarif bulunamadı. KALANLA uygulamasında akıllı kombinasyon motorunu deneyebilirsin!`, 
            ephemeral: true 
          });
        }

        const recipe = matched[Math.floor(Math.random() * matched.length)];
        const ingList = (recipe.ingredients || []).map(i => `• ${i.amount ? i.amount + ' ' : ''}${i.name}`).join('\n');
        // Tüm adımlar eksiksiz gösterilir
        const stepList = (recipe.instructions || []).map((s, idx) => `${idx + 1}. ${s}`).join('\n');

        const embed = new EmbedBuilder()
          .setColor(0xE5A93C)
          .setTitle(`🍲 ${recipe.title}`)
          .setDescription(recipe.description + '\n\n' +
            `⏱ **Süre:** ${recipe.durationMinutes} dk  |  👥 **Porsiyon:** ${recipe.servings}  |  💰 **Tasarruf:** ₺${recipe.savedTL}\n\n` +
            `**Gerekli Malzemeler & Net Ölçüler:**\n${ingList}\n\n` +
            `**Hazırlanışı:**\n${stepList}`
          )
          .setFooter({ text: `KALANLA Küratörlü Tarif Kataloğu (${matched.length} alternatif tarif)` });

        return interaction.reply({ embeds: [embed] });
      }

      // ── /hata (Modal Formu) ───────────────────────────────
      if (commandName === 'hata') {
        const modal = new ModalBuilder()
          .setCustomId('modal_kalanla_bug')
          .setTitle('KALANLA Hata Bildirimi');

        const deviceInput = new TextInputBuilder()
          .setCustomId('input_device')
          .setLabel('Telefon Modeli & Android Sürümü')
          .setPlaceholder('Örn: Samsung Galaxy A54, Android 14')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const issueInput = new TextInputBuilder()
          .setCustomId('input_issue')
          .setLabel('Karşılaşılan Sorun ve Adımlar')
          .setPlaceholder('Örn: Pişir butonuna bastığımda ekran dondu, malzemeler düşmedi...')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(deviceInput),
          new ActionRowBuilder().addComponents(issueInput)
        );

        return interaction.showModal(modal);
      }
    }

    // 3. MODAL GÖNDERİMİ HANDLER
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_kalanla_bug') {
        const device = interaction.fields.getTextInputValue('input_device');
        const issue = interaction.fields.getTextInputValue('input_issue');

        const bugEmbed = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('🐛 Yeni KALANLA Beta Hata Bildirimi')
          .addFields(
            { name: '👤 Bildiren', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
            { name: '📱 Cihaz / Model', value: device, inline: true },
            { name: '📝 Hata Açıklaması', value: issue }
          )
          .setTimestamp()
          .setFooter({ text: 'Durum: 🔴 Açık / İnceleniyor' });

        const bugChannel = interaction.guild.channels.cache.find(ch => 
          ch.name.includes('hata') || ch.name.includes('bug') || ch.name.includes('feedback')
        );

        if (bugChannel) {
          await bugChannel.send({ embeds: [bugEmbed] });
        } else {
          await interaction.channel.send({ embeds: [bugEmbed] });
        }

        return interaction.reply({ 
          content: '✅ Hata bildiriminiz başarıyla iletildi! Teşekkürler, mutfağı birlikte mükemmelleştiriyoruz. 🍳', 
          ephemeral: true 
        });
      }
    }
  } catch (err) {
    console.error('Interaction Hatası:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'İşlem sırasında bir hata oluştu.', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(DISCORD_TOKEN);