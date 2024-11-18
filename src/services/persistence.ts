/**
 * module persistence exports services for data persistence
 */
import {PersistenceProvider} from "../providers/persistence.js";

// Service class for data persistence
export class PersistenceService {
    private readonly provider: PersistenceProvider;

    constructor(provider: PersistenceProvider) {
        this.provider = provider;
    }

    async saveData(key: string, value: unknown): Promise<void> {
        await this.provider.save(key, value);
    }

    async getData(key: string): Promise<unknown> {
        return await this.provider.load(key);
    }

    static createFromEnv() {
        const persistenceProvider = process.env["PERSISTENCE_PROVIDER"];
        switch (persistenceProvider) {
            case "REDIS":
                break;
            default:
            case "LOCALFS":
                break;

        }
    }
}

