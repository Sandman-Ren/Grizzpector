import "dotenv/config";
import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v10';

import * as commands from '../commands.js';

if (process.env.DISCORD_TOKEN === undefined) {
    throw new Error(
        "Please set the DISCORD_TOKEN environment variable to your bot token."
    );
}

const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);
const commandsToRegister = Object.values(commands);
console.log(`The following commands will be registered:\n${commandsToRegister.map(c => ` ${c.name}`).join('\n')}`);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_APP_ID as string),
            {body: commandsToRegister},
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

})();