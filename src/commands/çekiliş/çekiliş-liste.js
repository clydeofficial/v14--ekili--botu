const Discord = require("discord.js");

module.exports = {
  slash: new Discord.SlashCommandBuilder()
    .setName("çekiliş-liste")
    .setDescription("Sunucudaki tüm çekilişleri listeler"),

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

    const çekilişler = await client.db.all();
    const aktifÇekilişler = çekilişler.filter((entry) =>
      entry.id.startsWith("çekiliş_")
    );

    if (aktifÇekilişler.length === 0) {
      return interaction.reply({
        content: "Sunucuda şu anda aktif bir çekiliş yok.",
        ephemeral: true,
      });
    }

    const embed = new Discord.EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("Aktif Çekilişler")
      .setDescription(
        aktifÇekilişler
          .map((ç) => {
            const çekiliş = ç.value;
            const bitişZamanı = `<t:${Math.floor(
              (çekiliş.başlangıç + çekiliş.süre) / 1000
            )}:R>`;
            return `ID: ${ç.id.replace("çekiliş_", "")}\nÖdül: ${
              çekiliş.ödül
            }\nBitiş Zamanı: ${bitişZamanı}\n`;
          })
          .join("\n")
      );

    interaction.reply({ embeds: [embed] });
  },
};