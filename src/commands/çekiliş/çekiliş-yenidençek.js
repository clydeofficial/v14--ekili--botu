const Discord = require("discord.js");

module.exports = {
  slash: new Discord.SlashCommandBuilder()
    .setName("çekiliş-yenidençek")
    .setDescription("Bir çekilişi yeniden çeker")
    .addStringOption((option) =>
      option.setName("id").setDescription("Çekiliş mesaj ID").setRequired(true)
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
    const kanal = interaction.channel;

    let mesaj;

    try {
      mesaj = await kanal.messages.fetch(id);
    } catch (error) {
      return interaction.reply({
        content: "Çekiliş mesajı bulunamadı.",
        ephemeral: true,
      });
    }

    const katılımcılar = mesaj.reactions.cache
      .get("🎉")
      .users.cache.filter((user) => !user.bot);

    if (katılımcılar.size === 0) {
      return interaction.reply({
        content: "Çekilişe kimse katılmadığı için kazanan yok!",
        ephemeral: true,
      });
    }

    const kazananlarListesi = katılımcılar.random(1);

    if (kazananlarListesi.length === 0) {
      return interaction.reply({
        content: "Yeniden çekiliş yapılacak kadar katılımcı yok!",
        ephemeral: true,
      });
    }

    await kanal.send(
      `Tebrikler ${kazananlarListesi
        .map((u) => `<@${u.id}>`)
        .join(", ")}! 🎉 kazandınız!`
    );

    await interaction.reply({
      content: "Yeni kazanan başarıyla belirlendi!",
      ephemeral: true,
    });
  },
};