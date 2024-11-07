/*
* modal-submit-handlers exports handles for responding to interactions of type MODAL_SUBMIT
* */
import {Request, Response} from 'express';
import {
    APIInteractionResponseCallbackData,
    APIInteractionResponseDeferredChannelMessageWithSource,
    APIModalSubmission,
    APIModalSubmitInteraction,
    InteractionResponseType,
    MessageFlags,
    Routes
} from "discord-api-types/v10";
import {
    AuthDataSaveDir,
    DiscordRestApiClient,
    GrizzpectorUserAgent,
    NintendoAccountAuthorizer,
    SignInModalPasteLinkCustomId
} from "../constants.js";
import CoralApi from "nxapi/coral";
import {getDiscordUserFromInteraction, keyFromDiscordUser, setDiscordUserToNxApiClientMap} from "../utilities.js";
import {persistNsoDataToFs, persistSplatnet3DataToFs} from "../persistence.js";
import path from "path";
import {NxApiClient} from "../nxapi-handlers.js";

export {
    handleModalSubmitInteraction
};

/**
 * Extracts and returns the pasted link from the given modal submission data.
 *
 * @param {APIModalSubmission} modalSubmissionData - The submission data from the sign-in modal containing the pasted link.
 * @return {string} The pasted link extracted from the modal submission data.
 */
function getPastedLinkFromSignInModalPasteLink(modalSubmissionData: APIModalSubmission): string {
    return modalSubmissionData.components[0].components[0].value;
}

function handleSignInModalPasteLink(_req: Request, res: Response, modalSubmitInteraction: APIModalSubmitInteraction) {
    {
        const pastedLink = getPastedLinkFromSignInModalPasteLink(modalSubmitInteraction.data);
        const authorizedUrl = new URL(pastedLink);
        const authorizedUrlSearchParams = new URLSearchParams(authorizedUrl.hash.substring(1));
        NintendoAccountAuthorizer.getSessionToken(authorizedUrlSearchParams)   // skips the initial pound(#) sign
            .then(token => {
                const sessionToken = token.session_token;
                return CoralApi.createWithSessionToken(sessionToken, GrizzpectorUserAgent);
            })
            .then(async ({data}) => {
                const interactionDiscordUser = getDiscordUserFromInteraction(modalSubmitInteraction);

                const nxapiClient = await NxApiClient.fromAuthData({
                    coralAuthData: data,
                    persistCoralAuthData: function (this: NxApiClient) {persistNsoDataToFs(this.coralAuthData, path.join(AuthDataSaveDir, `${keyFromDiscordUser(interactionDiscordUser)}.json`));},
                    persistSplatnet3AuthData: function (this: NxApiClient) {persistSplatnet3DataToFs(this.splatnet3AuthData, path.join(AuthDataSaveDir, `${keyFromDiscordUser(interactionDiscordUser)}-splatnet3.json`));},
                });

                setDiscordUserToNxApiClientMap(interactionDiscordUser, nxapiClient);

                // screeName: usually the email id
                // nickName: the associated Nintendo Account username
                // nsoAccount.user.name: the NSO account username, this is the name that one sees on a Switch console
                return DiscordRestApiClient.patch(
                    Routes.webhookMessage(
                        process.env.DISCORD_APP_ID as string,
                        modalSubmitInteraction.token,
                        "@original"
                    ),
                    {
                        body: {
                            content: `You've signed in as **${data.nsoAccount.user.name}**!`,
                            embeds: [{image: {url: data.nsoAccount.user.imageUri}}],
                            flags: MessageFlags.Ephemeral,
                        } as APIInteractionResponseCallbackData
                    }
                );
            });
        return res.json({type: InteractionResponseType.DeferredChannelMessageWithSource, data: {flags: MessageFlags.Ephemeral}} as APIInteractionResponseDeferredChannelMessageWithSource);
    }
}

function handleModalSubmitInteraction(req: Request, res: Response, modalSubmitInteraction: APIModalSubmitInteraction) {
    console.log(`Received modal submit interaction: ${JSON.stringify(modalSubmitInteraction)}`);
    const modalCustomId: string = modalSubmitInteraction.data.custom_id;
    switch (modalCustomId) {
        case SignInModalPasteLinkCustomId:
            return handleSignInModalPasteLink(req, res, modalSubmitInteraction);
        default:
            return res.status(400).send({error: `Unsupported modal custom id: ${modalCustomId}`});
    }
}
