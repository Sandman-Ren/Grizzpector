/*
* module nxapi-handlers contains code that interacts with NxAPI.
* */

import CoralApi, {CoralAuthData} from "nxapi/coral";
import SplatNet3Api, {SplatNet3AuthData} from "nxapi/splatnet3";

import {GrizzpectorUserAgent} from "./constants.js";
import {ErrorResponse} from "nxapi";

export {
    NxApiClient,
    /* types and interfaces */
    NxApiClientFromAuthDataOptions,
    NxApiClientFromCoralAuthDataOptions
};


interface NxApiClientFromAuthDataOptions {
    coralAuthData: CoralAuthData,
    splatnet3AuthData?: SplatNet3AuthData,
    persistCoralAuthData: (...args: unknown[]) => void,
    persistSplatnet3AuthData: (...args: unknown[]) => void,
    onCoralAuthDataExpired?: (...args: unknown[]) => Promise<void | CoralAuthData>,
    onSplatnet3AuthDataExpired?: (...args: unknown[]) => Promise<void | SplatNet3AuthData>,
}

type NxApiClientFromCoralAuthDataOptions = Omit<NxApiClientFromAuthDataOptions, "splatnet3AuthData">;

class NxApiClient {
    nsoSessionToken!: string;

    nso!: CoralApi;
    coralAuthData!: CoralAuthData;

    splatnet3!: SplatNet3Api;
    splatnet3AuthData!: SplatNet3AuthData;

    static _createNsoOnTokenExpiredHandler() {
        return async function (this: NxApiClient) {
            const partialCoralAuthData = this.nso.getToken(this.nsoSessionToken, this.coralAuthData.user);
            const updatedCoralAuthData = {...this.coralAuthData, ...partialCoralAuthData};
            this.coralAuthData = updatedCoralAuthData;
            this.persistCoralAuthData();
        };
    }

    static _createSplatnet3OnTokenExpiredHandler() {
        return async function (this: NxApiClient) {
            try {
                const data = await SplatNet3Api.loginWithWebServiceToken(this.splatnet3AuthData.webserviceToken, this.coralAuthData.user);
                this.splatnet3AuthData = data;
                this.persistSplatnet3AuthData();
            } catch (err) {
                // see https://github.com/samuelthomas2774/nxapi/blob/589a5ea22004f90d475c2c7fc60b9ab638fde14b/docs/lib/splatnet3.md#splatnet3apiontokenexpired
                if (err instanceof ErrorResponse && err.response.status === 401) {
                    // 401: our web service token has expired, we need to log in with Coral again
                    const data = await SplatNet3Api.loginWithCoral(this.nso, this.coralAuthData.user);
                    this.splatnet3AuthData = data;
                    this.persistSplatnet3AuthData();
                }
                // otherwise throw the error
                throw err;
            }
        };
    }

    static async fromCoralAuthData(options: NxApiClientFromCoralAuthDataOptions): Promise<NxApiClient> {
        const nso = CoralApi.createWithSavedToken(options.coralAuthData, GrizzpectorUserAgent);

        const nxapiClient = new NxApiClient();
        nxapiClient.nso = nso;
        nxapiClient.coralAuthData = options.coralAuthData;
        nxapiClient.nsoSessionToken = nso.token;
        nxapiClient.persistCoralAuthData = options.persistCoralAuthData.bind(nxapiClient);
        nxapiClient.persistCoralAuthData();

        const {splatnet, data} = await SplatNet3Api.createWithCoral(nxapiClient.nso, options.coralAuthData.user);
        nxapiClient.splatnet3 = splatnet;
        nxapiClient.splatnet3AuthData = data;
        nxapiClient.persistSplatnet3AuthData = options.persistSplatnet3AuthData.bind(nxapiClient);
        nxapiClient.persistSplatnet3AuthData();

        nxapiClient.nso.onTokenExpired = options.onCoralAuthDataExpired?.bind(nxapiClient) ?? NxApiClient._createNsoOnTokenExpiredHandler().bind(nxapiClient);
        nxapiClient.splatnet3.onTokenExpired = options.onSplatnet3AuthDataExpired?.bind(nxapiClient) ?? NxApiClient._createSplatnet3OnTokenExpiredHandler().bind(nxapiClient);

        return nxapiClient;
    }

    static async fromAuthData(options: NxApiClientFromAuthDataOptions): Promise<NxApiClient> {
        if (options.splatnet3AuthData === undefined) {
            return NxApiClient.fromCoralAuthData(options);
        } else {
            const nso = CoralApi.createWithSavedToken(options.coralAuthData, GrizzpectorUserAgent);
            const splatnet3 = SplatNet3Api.createWithSavedToken(options.splatnet3AuthData);
            const nxapiClient = new NxApiClient();
            nxapiClient.nso = nso;
            nxapiClient.coralAuthData = options.coralAuthData;
            nxapiClient.nsoSessionToken = nso.token;
            nxapiClient.persistCoralAuthData = options.persistCoralAuthData.bind(nxapiClient);


            nxapiClient.splatnet3 = splatnet3;
            nxapiClient.splatnet3AuthData = options.splatnet3AuthData;
            nxapiClient.persistSplatnet3AuthData = options.persistSplatnet3AuthData.bind(nxapiClient);

            nxapiClient.nso.onTokenExpired = options.onCoralAuthDataExpired?.bind(nxapiClient) ?? NxApiClient._createNsoOnTokenExpiredHandler().bind(nxapiClient);
            nxapiClient.splatnet3.onTokenExpired = options.onSplatnet3AuthDataExpired?.bind(nxapiClient) ?? NxApiClient._createSplatnet3OnTokenExpiredHandler().bind(nxapiClient);

            return nxapiClient;
        }
    }

    persistCoralAuthData() {

    }

    persistSplatnet3AuthData() {

    }

    async getMostRecentShiftDetails() {
        const latest = await this.splatnet3.getCoopHistoryLatest();
        const latestShiftId = latest.data.coopResult.historyGroupsOnlyFirst.nodes[0].historyDetails.nodes[0].id;
        // try to see if this exists in the details we've retrieved. if not, query explicitly for this detail
        const latestShiftDetail = await this.splatnet3.getCoopHistoryDetail(latestShiftId);
        return latestShiftDetail;
    }
}
