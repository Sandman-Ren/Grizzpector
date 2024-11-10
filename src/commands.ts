import {
    ApplicationCommandData,
    ApplicationCommandOptionData,
    ApplicationCommandOptionType,
    ApplicationCommandType, ChatInputApplicationCommandData
} from "discord.js";

export {PokeCommand, SignInCommand, InspectCommand};

const PokeCommand: ChatInputApplicationCommandData = {
    name: "poke",
    type: ApplicationCommandType.ChatInput,
    description: "Sneakily pokes Grizzpector to see if he's actually working!",
    options: [],
};

const InspectCommand: ChatInputApplicationCommandData = {
    name: "inspect",
    type: ApplicationCommandType.ChatInput,
    description: "Grizzpector inspects the results of the most recent Salmon Run shift.",
    options: [
        {
            type: ApplicationCommandOptionType.Boolean,
            name: "public",
            description: "Whether the inspection result should be visible to everyone.",
            required: false,

        } as ApplicationCommandOptionData
    ],
};

const SignInCommand: ApplicationCommandData = {
    name: "signin",
    type: ApplicationCommandType.ChatInput,
    description: "Sign in to Nintendo Switch Online so that Grizzpector can inspect your shift results.",
    options: []
};
