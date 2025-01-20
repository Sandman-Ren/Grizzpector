import "dotenv/config";

import express from "express";
import {
    APIApplicationCommandInteraction,
    APIInteraction,
    APIMessageComponentInteraction, APIModalSubmitInteraction,
    InteractionResponseType,
    InteractionType
} from "discord-api-types/v10";
import {verifyKeyMiddleware} from "discord-interactions";
import {handleApplicationCommandInteraction} from "./handlers/application-command-handlers.js";
import {handleMessageComponentInteraction} from "./handlers/message-component-handlers.js";
import {handleModalSubmitInteraction} from "./handlers/modal-submit-handlers.js";
import {logger} from "./logging.js";

if (process.env.DISCORD_TOKEN === undefined) {
    throw new Error(
        "Please set the DISCORD_TOKEN environment variable to your bot token."
    );
}

if (process.env.DISCORD_APP_ID === undefined) {
    throw new Error(
        "Please set the DISCORD_APP_ID environment variable to your Discord App Id."
    );
}

function createExpressApp(discordPublicKey: string): express.Express {

    // set up routes for handling discord actions
    const discordRouter = express.Router();
    // discord periodically sends PINGs with invalid key signatures to test if we're actually validating it
    // @ts-ignore
    discordRouter.post("/interactions", verifyKeyMiddleware(discordPublicKey), (req: express.Request, res: express.Response) => {
        const interaction: APIInteraction = req.body;
        logger.info(`received interaction: ${JSON.stringify(interaction, null, 2)}`);
        switch (interaction.type) {
            case InteractionType.Ping: {
                return res.json({type: InteractionResponseType.Pong});
            }
            case InteractionType.ApplicationCommand:
                logger.info(`received application command: ${(interaction as APIApplicationCommandInteraction).data.name}`);
                return handleApplicationCommandInteraction(req, res, interaction as APIApplicationCommandInteraction);
            case InteractionType.MessageComponent: {
                logger.info(`received message component interaction: ${(interaction as APIMessageComponentInteraction).data.custom_id}`);
                return handleMessageComponentInteraction(req, res, interaction as APIMessageComponentInteraction);
            }
            case InteractionType.ModalSubmit: {
                logger.info(`received modal submit interaction: ${(interaction as APIModalSubmitInteraction).data.custom_id}`);
                return handleModalSubmitInteraction(req, res, interaction as APIModalSubmitInteraction);
            }
            default: {
                return res.status(400).send({
                    error: `Interaction type not supported: ${interaction.type}`
                });
            }
        }
    });

    const app = express();
    app.use("/api", discordRouter);

    return app;
}

createExpressApp(
    process.env.DISCORD_PUBLIC_KEY!
).listen(
    3000,
    () => console.log("Listening on port 3000")
);

