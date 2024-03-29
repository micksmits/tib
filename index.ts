import { Client, Collection, GatewayIntentBits, REST, Routes, EmbedBuilder, type TextChannel } from 'discord.js';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

const client = new Client({ intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds] });
const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;

(async () => {
  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get('1170060748748238848') as TextChannel;

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#b700ff')
      .setTitle('Welcome to the Interstellar Refugee')
      .setDescription(`Welcome <@${member.user.id}>`)
      .setThumbnail('https://i.imgur.com/a9GXe4z.png');

    channel.send({ embeds: [welcomeEmbed] });
  });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // @ts-expect-error - figure out why command isn't part of Client
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    await command.execute(interaction);
  });

  // @ts-expect-error - figure out why command isn't part of Client
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

  const commands = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command = require(filePath).default;

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      // @ts-expect-error - this is fine
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  const rest = new REST().setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, '1158043639985995898'),
    { body: commands }
  );

  await client.login(TOKEN);
})();
