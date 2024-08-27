const Discord = require("discord.js");

/**
 *
 * @param {Discord.Interaction} interaction
 * @returns
 */

module.exports = async (client, interaction) => {
  if (interaction.isAutocomplete())
    return require("./autoComplete.js")(client, interaction);
  if (!interaction.isChatInputCommand()) return;
  const db = client.db;
  const command = client.commands.get(interaction.commandName);
  if (!command)
    return interaction.reply({
      content: "Yanlış bir yere düştün. (Komut Bulunamadı)",
      ephemeral: true,
    });
  command.execute(client, interaction, client.db);
};