/*
* module persistence exports classes for providing a persistence layer for Grizzpector
* */

import fs from "fs";
import path from "path";

/**
 * PersistenceProvide is an abstract class representing a layer of persistence. An implementing provider should behave
 * like a hashmap that takes in a key for persistence and retrieval.
 * @class PersistenceProvider
 */
abstract class PersistenceProvider {
    abstract save(key: unknown, data: unknown): Promise<unknown> | unknown;
    abstract load(key: unknown): Promise<unknown> | unknown;
}

class LocalFsJsonPersistenceProviderSync extends PersistenceProvider {

    baseDir: string;

    /**
     * Initializes a new instance of the class with the specified base directory.
     *
     * @param {string} baseDir - The base directory to initialize the instance with.
     * @return {void} This constructor does not return a value.
     */
    constructor(baseDir: string) {
        super();
        this.baseDir = baseDir;
    }

    /**
     * Converts the given key to a specific file path by combining it with the base directory
     * and appending the .json extension.
     *
     * @param {string} key - The unique identifier to be converted into a file path.
     * @return {string} The resulting path string which includes the base directory and the .json extension.
     */
    _keyToPath(key: string): string {
        return path.join(this.baseDir, `${key}.json`);
    }

    save(key: string, data: string): void {
        fs.writeFileSync(
            this._keyToPath(key),
            JSON.stringify(data)
        );
    }

    load(key: string): string {
        const filePath= this._keyToPath(key);
        if (!fs.existsSync(filePath)) {
            throw new Error(`key ${key} not found`);
        }

        return fs.readFileSync(filePath).toString();
    }
}
