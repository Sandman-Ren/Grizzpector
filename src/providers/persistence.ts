/**
 * module persistence exports persistence providers that behaves like key-value stores. methods are async.
 */

import asyncFs from "fs/promises";
import path from "path";
import {createClient, RedisClientType} from 'redis';

export {
    PersistenceProvider,
    LocalFsJsonPersistenceProvider,
    RedisPersistenceProvider,
};

abstract class PersistenceProvider {
    abstract save(key: string, value: unknown): Promise<unknown>;

    abstract load(key: string): Promise<unknown>;
}

class LocalFsJsonPersistenceProvider extends PersistenceProvider {
    baseDirectory: string;

    constructor(baseDirectory: string) {
        super();
        this.baseDirectory = baseDirectory;
    }

    private keyToFilePath(key: string): string {
        return path.join(this.baseDirectory, `${key}.json`);
    }

    async save(key: string, value: unknown): Promise<void> {
        const filePath = this.keyToFilePath(key);
        await asyncFs.mkdir(this.baseDirectory, {recursive: true});
        await asyncFs.writeFile(filePath, JSON.stringify(value, null, 2));
    }

    async load(key: string): Promise<unknown> {
        const filePath = this.keyToFilePath(key);
        const data = await asyncFs.readFile(filePath, {encoding: 'utf-8'});
        return JSON.parse(data);
    }
}

class RedisPersistenceProvider extends PersistenceProvider {
    client: RedisClientType;

    constructor(redisUrl: string) {
        super();
        this.client = createClient({url: redisUrl});
        this.client.on('error', console.error);
    }

    async connect(): Promise<void> {
        await this.client.connect();
    }

    async save(key: string, value: unknown): Promise<void> {
        await this.client.set(key, JSON.stringify(value));
    }

    async load(key: string): Promise<unknown> {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async disconnect(): Promise<void> {
        await this.client.disconnect();
    }
}
