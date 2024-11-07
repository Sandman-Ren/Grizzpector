import {
    APIActionRowComponent,
    APIApplicationCommandInteraction,
    APIApplicationCommandInteractionDataBooleanOption,
    APIButtonComponent,
    APIButtonComponentWithCustomId,
    APIButtonComponentWithURL,
    APIChatInputApplicationCommandInteractionData,
    APIInteractionResponseCallbackData,
    APIInteractionResponseChannelMessageWithSource,
    APIInteractionResponseDeferredChannelMessageWithSource,
    ButtonStyle,
    ComponentType,
    InteractionResponseType,
    MessageFlags,
    Routes
} from "discord-api-types/v10";
import {Request, Response} from 'express';
import {InspectCommand, PokeCommand, SignInCommand} from "../commands.js";
import {addUserAgent} from "nxapi";
import {
    DiscordRestApiClient,
    GrizzpectorUserAgent,
    NintendoAccountAuthorizer,
    PasteLinkButtonCustomId
} from "../constants.js";
import {getDiscordUserFromInteraction, getNxApiClientFromDiscordUserToNxApiClientMap} from "../utilities.js";
import {NxApiClient} from "../nxapi-handlers.js";

addUserAgent(GrizzpectorUserAgent);

export function handleApplicationCommandInteraction(req: Request, res: Response, applicationCommandInteraction: APIApplicationCommandInteraction) {
    const applicationCommandName = applicationCommandInteraction.data.name;
    switch (applicationCommandName) {
        case PokeCommand.name:
            return handlePoke(req, res, applicationCommandInteraction);
        case SignInCommand.name:
            return handleSignIn(req, res, applicationCommandInteraction);
        case InspectCommand.name:
            return handleInspect(req, res, applicationCommandInteraction);
        default:
            return res.status(400).send({
                error: `Unsupported application command name: ${applicationCommandName}`
            });
    }
}

function handlePoke(_req: Request, res: Response, _: APIApplicationCommandInteraction) {
    return res.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: "Hey, I'm working!"
        }
    });
}

function handleSignIn(_req: Request, res: Response, _applicationCommandInteraction: APIApplicationCommandInteraction) {
    // use nxapi to sign in the user to NxApi
    const authorizationUrl = NintendoAccountAuthorizer.authorise_url;
    return res.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content:
                'Please follow the steps below to sign in:\n' +
                '1. **Click on the "Sign In via NSO", or copy [this sign in link](${authorizationUrl}) and paste it in your browser.**\n' +
                '2. **In the web page that opens, sign in to Nintendo Switch Online.**\n' +
                '3. **After signing in, you will be redirected to the "Link an account" page, copy the link in the "Select this account" button**\n' +
                '   > - PC/Mac users: right click on the "Select this account" button and select "Copy link address"\n' +
                '   > - Mobile users: long press on the "Select this account" button and select "Copy link address"\n' +
                '       > 💡If you cannot long press or do not see a "colpy link address" option, try using a different browser.\n' +
                '4. **Click on the "Paste link" button, in the modal that opens, paste the link in the "Paste link" text input and submit!**\n' +
                'If sign in is successful, Grizzpector will show your NSO username.',
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            label: "Sign In via NSO",
                            style: ButtonStyle.Link,
                            url: authorizationUrl
                        } as APIButtonComponentWithURL,
                        {
                            type: ComponentType.Button,
                            label: "Paste link",
                            style: ButtonStyle.Primary,
                            custom_id: PasteLinkButtonCustomId
                        } as APIButtonComponentWithCustomId
                    ]
                } as APIActionRowComponent<APIButtonComponent>
            ],
            flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds
        }
    } as APIInteractionResponseChannelMessageWithSource);
}

function handleInspect(_req: Request, res: Response, applicationCommandInteraction: APIApplicationCommandInteraction) {
    const discordUser = getDiscordUserFromInteraction(applicationCommandInteraction);
    const chatInputApplicationCommandInteractionData = applicationCommandInteraction.data as APIChatInputApplicationCommandInteractionData;
    const publicOption = chatInputApplicationCommandInteractionData?.options?.find(option => option.name === "public");
    const shouldBePublic = (publicOption as APIApplicationCommandInteractionDataBooleanOption)?.value === true;
    console.log(`inspect command public option: ${JSON.stringify(publicOption)}, should be public?: ${shouldBePublic}`);


    if (discordUser === undefined) {
        return res.status(400).send({
            error: "Application command interaction is not invoked by a user or a user in a guild"
        });
    }

    const nxApiClient = getNxApiClientFromDiscordUserToNxApiClientMap(discordUser) as NxApiClient;
    if (nxApiClient === undefined) {
        return res.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `💡 Looks like you haven't signed in yet. Please use /${SignInCommand.name} to sign in 😊`,
                flags: MessageFlags.Ephemeral
            }
        } as APIInteractionResponseChannelMessageWithSource);
    }

    const scoreFunction = (powerEggs: number,
                           goldenEggs: number,
                           goldenEggsAssists: number,
                           defeatEnemyCount: number,
                           rescueCount: number,
                           rescuedCount: number) => {
        return (
            powerEggs * 1.0 + goldenEggs * 100.0 + goldenEggsAssists * 20.0 +
            300.0 * defeatEnemyCount +
            50.0 * rescueCount + (-100.0) * rescuedCount
        );
    };

    const generateMarkdownList = function (scoredResults: { playerName: string, score: number }[]) {
        const sortedScoredResults = [...scoredResults].sort((a, b) => b.score - a.score);
        let markdownList = "";
        sortedScoredResults.forEach((result, index) => {
            markdownList += `${index + 1}. ${result.playerName}: ${result.score}\n`;
        });
        return markdownList;
    };

    nxApiClient.getMostRecentShiftDetails()
        .then(mostRecentShiftDetails => {
            const playerResults = [
                mostRecentShiftDetails.data.coopHistoryDetail.myResult,
                ...mostRecentShiftDetails.data.coopHistoryDetail.memberResults
            ];

            const scoredResults = [] as { playerName: string, score: number }[];

            playerResults.forEach(result => {
                const playerName = result.player.name;
                const score = scoreFunction(
                    result.deliverCount,
                    result.goldenDeliverCount,
                    result.goldenAssistCount,
                    result.defeatEnemyCount,
                    result.rescueCount,
                    result.rescuedCount
                );
                scoredResults.push({playerName, score});
            });

            const markdownList = generateMarkdownList(scoredResults);
            DiscordRestApiClient.patch(
                Routes.webhookMessage(
                    process.env.DISCORD_APP_ID!,
                    applicationCommandInteraction.token,
                    "@original"
                ),
                {
                    body: {
                        content: markdownList
                    } as APIInteractionResponseCallbackData
                }
            );
        });


    return res.json({
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {flags: (!shouldBePublic) && MessageFlags.Ephemeral }
    } as APIInteractionResponseDeferredChannelMessageWithSource);


}
