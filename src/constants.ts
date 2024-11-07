/*
* constants exports the constants used in this project
* */
import path from "path";
import {NintendoAccountSessionAuthorisationCoral} from "nxapi/coral";
import {NxApiClient} from "./nxapi-handlers.js";
import {createDiscordRestApi} from "./utilities.js";

export {
    GrizzpectorUserAgent,
    /* message components modal ids */
    PasteLinkButtonCustomId,
    /* modal custom ids */
    SignInModalPasteLinkCustomId,

    /* persistence to local fs */
    RunRoot,
    DataRoot,
    AuthDataSaveDir,

    /* authorization */
    NintendoAccountAuthorizer,

    /* nxapi clients */
    DiscordUserToNxApiClient,

    /* discord rest api client */
    DiscordRestApiClient,
};

const GrizzpectorUserAgent = "Grizzpector/1.0.0 (+https://github.com/Sandman-Ren/Grizzpector)";

/* message component modal ids */
const PasteLinkButtonCustomId = "signIn.button.pasteLink";

/* modal custom ids */
const SignInModalPasteLinkCustomId = "signIn.modal.pasteLink";

/* dynamically resolves to the directory where the project is run */

/**
 * `RunRoot` is a constant that dynamically resolves to the current working directory
 * where the project is run.
 */
const RunRoot = process.cwd();
/**
 * `DataRoot` resolves to {@link RunRoot}/data for storing data that is used by Grizzpector
 */
const DataRoot = path.join(RunRoot, "data");
/**
 * `AuthDataSaveDir` resolves to {@link DataRoot}/'auth' for storing NXAPI auth data
 */
const AuthDataSaveDir = path.join(DataRoot, "auth");

/* authorization */
const NintendoAccountAuthorizer = NintendoAccountSessionAuthorisationCoral.create();

/* nxapi client */
const DiscordUserToNxApiClient = new Map<string, NxApiClient>();

/* discord REST API client */
const DiscordRestApiClient = createDiscordRestApi({version: "10"}, process.env.DISCORD_TOKEN!);