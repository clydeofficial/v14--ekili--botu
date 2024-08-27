const Discord = require("discord.js");

module.exports = {
  slash: new Discord.SlashCommandBuilder()
    .setName("çekiliş-bitir")
    .setDescription("Bir çekilişi bitirir")
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("Çekiliş ID")
        .setRequired(true)
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

    const id = interaction.options.getString("id");
    let çekiliş;
    const keys = await client.db.all();

    for (const key of keys) {
      if (
        key.id.includes("çekiliş_") &&
        (key.id === `çekiliş_${id}` || key.value.mesajID === id)
      ) {
        çekiliş = key.value;
        break;
      }
    }

    if (!çekiliş) {
      return interaction.reply({
        content: "Bu ID'ye sahip bir çekiliş bulunamadı.",
        ephemeral: true,
      });
    }

    const kanal = client.channels.cache.get(çekiliş.kanal);
    let mesaj;

    try {
      mesaj = await kanal.messages.fetch(çekiliş.mesajID || id);
    } catch (error) {
      return interaction.reply({
        content: "Çekiliş mesajı bulunamadı.",
        ephemeral: true,
      });
    }

    const katılımcılar = mesaj.reactions.cache
      .get("🎉")
      .users.cache.filter(
        (user) =>
          !user.bot &&
          (!çekiliş.rol ||
            interaction.guild.members.cache
              .get(user.id)
              .roles.cache.has(çekiliş.rol))
      );
    const kazananlarListesi = katılımcılar.random(çekiliş.kazananlar);

    let embedAçıklaması;
    let duyuruMesaj;

    if (kazananlarListesi.length === 0) {
      embedAçıklaması = "Çekilişe kimse katılmadığı için kazanan yok!";
    } else {
      embedAçıklaması = `Kazananlar: **${kazananlarListesi
        .map((u) => `<@${u.id}>`)
        .join(", ")}**\nÖdül: **${çekiliş.ödül}**`;
      duyuruMesaj = `Tebrikler **${kazananlarListesi
        .map((u) => `<@${u.id}>`)
        .join(", ")}! **${çekiliş.ödül}** kazandınız!`;
    }

    const embed = new Discord.EmbedBuilder()
      .setColor(kazananlarListesi.length === 0 ? "#FF0000" : "#00FF00")
      .setTitle("🎉 Çekiliş Bitti! 🎉")
      .setDescription(embedAçıklaması)
      .addFields({
        name: "Çekiliş Durumu",
        value: "Bu çekiliş sona ermiştir.",
      })
      .setTimestamp();

    await mesaj.edit({ embeds: [embed] });

    if (duyuruMesaj) {
      await kanal.send(duyuruMesaj);
    }

    await client.db.delete(`çekiliş_${id}`);
    await interaction.reply({
      content: "Çekiliş başarıyla bitirildi.",
      ephemeral: true,
    });
  },
};