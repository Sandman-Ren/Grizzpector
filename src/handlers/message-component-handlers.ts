/*
* module message-component-handlers exports handlers for message component interactions
* */

import {
    APIActionRowComponent,
    APIMessageComponentInteraction,
    APIModalInteractionResponse,
    APITextInputComponent,
    ComponentType,
    InteractionResponseType,
    TextInputStyle
} from "discord-api-types/v10";
import {Request, Response} from 'express';
import {PasteLinkButtonCustomId, SignInModalPasteLinkCustomId} from "../constants.js";

export {handleMessageComponentInteraction};

function handleMessageComponentInteraction(_req: Request, res: Response, messageComponentInteraction: APIMessageComponentInteraction) {
    const messageComponentId = messageComponentInteraction.data.custom_id;
    switch (messageComponentId) {
        case PasteLinkButtonCustomId:
            return res.json({
                type: InteractionResponseType.Modal,
                data: {
                    custom_id: SignInModalPasteLinkCustomId,
                    title: "Paste Link",
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.TextInput,
                                    custom_id: "signIn.modal.pasteLink.textInput",
                                    label: 'Your NSO "Select this account" link',
                                    style: TextInputStyle.Short,
                                    placeholder: "npf71b963c1b7b6d119://auth..."
                                }
                            ]
                        } as APIActionRowComponent<APITextInputComponent>
                    ]
                }
            } as APIModalInteractionResponse);
        default:
            return res.status(400).send({error: `Unsupported message component id: ${messageComponentId}`});
    }
}