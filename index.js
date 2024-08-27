const db = new (require("quick.db").QuickDB)({
  filePath: "./src/database/db.sqlite",
});
const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [Object.values(Discord.GatewayIntentBits)],
});
const fs = require("fs");
const config = require("./config.json");
client.commands = new Discord.Collection();
client.config = config;
client.db = db;

client.on("ready", () => {
  console.log(`${client.user.username} olarak giriş yapıldı.`);
  client.application.commands.set(client.commands.map((cmd) => cmd.slash));
});

const komutlarDosyasi = fs.readdirSync("./src/commands/");
for (const kategori of komutlarDosyasi) {
  const commands = fs
    .readdirSync(`./src/commands/${kategori}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of commands) {
    const dosya = require(`./src/commands/${kategori}/${file}`);
    if (!dosya.execute || !dosya.slash) continue;
    client.commands.set(dosya.slash.name, dosya);
    console.log(`Komut ${dosya.slash.name} yüklendi. (Kategori: ${kategori})`);
  }
}

fs.readdir("./src/events", (err, files) => {
  if (err) return console.error(err);
  files
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const event = require(`./src/events/${file}`);
      const eventad = file.slice(0, -3);
      client.on(eventad, (...args) => event(client, ...args));
      delete require.cache[require.resolve(`./src/events/${file}`)];
    });
});

client.login(config.token);