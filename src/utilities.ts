/*
* utilities exports helper functions used in Grizzpector
* */

import {REST, RESTOptions} from "discord.js";
import {AccountLogin} from "nxapi/coral";
import {APIInteraction, APIUser} from "discord-api-types/v10";
import {NxApiClient} from "./nxapi-handlers.js";
import {DiscordUserToNxApiClient} from "./constants.js";

export function createDiscordRestApi(options: Partial<RESTOptions>, discordToken: string): REST {
    return new REST(options).setToken(discordToken);
}

/**
 * Generates a unique key string from the provided NSO account information.
 * This key is of the format: <{@link nsoAccount.user.name}>-<{@link nsoAccount.user.id}>
 * @param {AccountLogin} nsoAccount - The account object containing user information.
 * @return {string} A unique key derived from the user's name and ID.
 */
export function keyFromNsoAccount(nsoAccount: AccountLogin): string {
    return `${nsoAccount.user.name}-${nsoAccount.user.id}`;
}

/**
 * Generates a unique key string from a Discord user object.
 * This key is of the format: <{@link discordUser.username}>-<{@link discordUser.id}>
 * @param {APIUser} discordUser The Discord user object containing `username` and `id` properties.
 * @return {string} A concatenated string with the format "username-id".
 */
export function keyFromDiscordUser(discordUser: APIUser): string {
    return `${discordUser.username}-${discordUser.id}`;
}

/**
 * Retrieves the Discord user associated with a given interaction.
 *
 * @param {APIInteraction} interaction - The interaction object from which to extract the user information.
 * @return {APIUser} The extracted Discord user.
 */
export function getDiscordUserFromInteraction(interaction: APIInteraction): APIUser {
    return interaction.user ?? interaction.member?.user as APIUser;
}

/**
 * Associates a Discord user with an NxApiClient instance and stores the mapping.
 *
 * @param {APIUser} discordUser - The Discord user object to be mapped.
 * @param {NxApiClient} nxApiClient - The NxApiClient instance to associate with the Discord user.
 * @return {void} This function does not return a value.
 */
export function setDiscordUserToNxApiClientMap(discordUser: APIUser, nxApiClient: NxApiClient) {
    DiscordUserToNxApiClient.set(keyFromDiscordUser(discordUser), nxApiClient);
}

/**
 * Retrieves the NxApiClient associated with a given Discord user.
 *
 * @param {APIUser} discordUser - The Discord user for whom to retrieve the NxApiClient.
 * @return {NxApiClient | undefined} The NxApiClient associated with the given Discord user, or undefined if none exists.
 */
export function getNxApiClientFromDiscordUserToNxApiClientMap(discordUser: APIUser): NxApiClient | undefined {
    return DiscordUserToNxApiClient.get(keyFromDiscordUser(discordUser));
}
