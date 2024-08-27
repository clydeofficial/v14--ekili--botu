const Discord = require("discord.js");
const ms = require("ms");

module.exports = {
  slash: new Discord.SlashCommandBuilder()
    .setName("çekiliş-oluştur")
    .setDescription("Çekiliş oluşturur")
    .addIntegerOption((option) =>
      option
        .setName("kazananlar")
        .setDescription("Kazanan kişi sayısı")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("ödül").setDescription("Çekiliş ödülü").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("süre")
        .setDescription(
          "Çekiliş süresi (örn: 1 hafta 2 gün 3 saat 5 dakika 10 saniye)"
        )
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("rol")
        .setDescription("Katılabilecek rol")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option.setName("afiş").setDescription("Çekiliş afişi").setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("kanal")
        .setDescription("Çekilişin yapılacağı kanal")
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName("sponsor")
        .setDescription("Çekiliş sponsoru")
        .setRequired(false)
    ),

  execute: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(
        Discord.PermissionFlagsBits.Administrator
      )
    ) {
      return interaction.reply({
        content:
          "Bu komutu kullanmak için Administrator yetkisine sahip olmalısınız!",
        ephemeral: true,
      });
    }

    const kazananlar = interaction.options.getInteger("kazananlar");
    const ödül = interaction.options.getString("ödül");
    const süre = interaction.options.getString("süre");
    const rol = interaction.options.getRole("rol");
    const afiş = interaction.options.getAttachment("afiş");
    const kanal =
      interaction.options.getChannel("kanal") || interaction.channel;
    const sponsor = interaction.options.getUser("sponsor");

    const çekilişSüresi = ms(
      süre
        .replace("hafta", "w")
        .replace("gün", "d")
        .replace("saat", "h")
        .replace("dakika", "m")
        .replace("saniye", "s")
    );

    if (!çekilişSüresi) {
      return interaction.reply({
        content: "Geçersiz süre formatı!",
        ephemeral: true,
      });
    }

    const bitişZamanı = Date.now() + çekilişSüresi;

    const embed = new Discord.EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("🎉 Çekiliş Başladı! 🎉")
      .setDescription(
        `Ödül: **${ödül}**\nKazananlar: **${kazananlar}**\n${
          rol ? `Katılabilecek Rol: ${rol}` : ""
        }\n${sponsor ? `Sponsor: ${sponsor}` : ""}`
      )
      .setFooter({
        text: "Clyde YouTube",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp(bitişZamanı)
      .addFields({
        name: "Bitiş Zamanı",
        value: `<t:${Math.floor(bitişZamanı / 1000)}:R>`,
        inline: false,
      });

    if (afiş) {
      embed.setImage(afiş.url);
    }

    const mesaj = await kanal.send({ embeds: [embed] });
    await mesaj.react("🎉");

    const çekilişVerileri = {
      kazananlar,
      ödül,
      süre: çekilişSüresi,
      rol: rol ? rol.id : null,
      afiş: afiş ? afiş.url : null,
      kanal: kanal.id,
      sponsor: sponsor ? sponsor.id : null,
      başlangıç: Date.now(),
      mesajID: mesaj.id,
    };

    const çekilişID = `çekiliş_${Date.now()}`;
    await client.db.set(çekilişID, çekilişVerileri);

    const filter = (reaction, user) =>
      reaction.emoji.name === "🎉" && !user.bot;
    const collector = mesaj.createReactionCollector({
      filter,
      time: çekilişSüresi,
    });

    collector.on("end", async () => {
      const katılımcılar = mesaj.reactions.cache
        .get("🎉")
        .users.cache.filter(
          (user) =>
            !user.bot &&
            (!rol ||
              interaction.guild.members.cache
                .get(user.id)
                .roles.cache.has(rol.id))
        );

      const kazananlarListesi = katılımcılar.random(kazananlar);

      let embedAçıklaması;
      let duyuruMesaj;

      if (kazananlarListesi.length === 0) {
        embedAçıklaması = "Çekilişe kimse katılmadığı için kazanan yok!";
      } else {
        embedAçıklaması = `Kazananlar: **${kazananlarListesi
          .map((u) => `<@${u.id}>`)
          .join(", ")}**\nÖdül: **${ödül}**`;
        duyuruMesaj = `Tebrikler ${kazananlarListesi
          .map((u) => `<@${u.id}>`)
          .join(", ")}! **${ödül}** kazandınız!`;
      }

      const resultEmbed = new Discord.EmbedBuilder()
        .setColor(kazananlarListesi.length === 0 ? "#FF0000" : "#00FF00")
        .setTitle("🎉 Çekiliş Bitti! 🎉")
        .setDescription(embedAçıklaması)
        .addFields({
          name: "Çekiliş Durumu",
          value: "Bu çekiliş sona ermiştir.",
        })
        .setTimestamp();

      await mesaj.edit({ embeds: [resultEmbed] });

      if (duyuruMesaj) {
        await kanal.send(duyuruMesaj);
      }

      await client.db.delete(çekilişID);
    });
  },
};