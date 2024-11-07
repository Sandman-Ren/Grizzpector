/*
* persistence exports functions for persisting data that are used across REST API calls in Grizzpector
* */
import {CoralAuthData} from "nxapi/coral";
import fs, {PathLike} from "fs";
import path from "path";
import {SplatNet3AuthData} from "nxapi/splatnet3";

export {
    persistNsoDataToFs, loadNsoDataFromFs,
    persistSplatnet3DataToFs, loadSplatnet3DataFromFs,
};

function persistNsoDataToFs(data: CoralAuthData, saveFile: PathLike, createDir: boolean = true) {
    if (!fs.existsSync(saveFile)) {
        const saveDir = path.dirname(saveFile.toString());
        if (!fs.existsSync(saveDir) && !createDir) {
            throw new Error(`Parent directory ${saveDir} does not exist and createDir is false.`);
        }

        fs.mkdirSync(saveDir, {recursive: true});
    }
    fs.writeFileSync(saveFile, JSON.stringify(data));
}

function loadNsoDataFromFs(saveFile: PathLike): CoralAuthData {
    if (!fs.existsSync(saveFile)) {
        throw new Error(`File ${saveFile} does not exist.`);
    }

    return JSON.parse(fs.readFileSync(saveFile, "utf-8"));
}

function persistSplatnet3DataToFs(data: SplatNet3AuthData, saveFile: PathLike, createDir: boolean = true) {
    if (!fs.existsSync(saveFile)) {
        const saveDir = path.dirname(saveFile.toString());
        if (!fs.existsSync(saveDir) && !createDir) {
            throw new Error(`Parent directory ${saveDir} does not exist and createDir is false.`);
        }
        fs.mkdirSync(saveDir, {recursive: true});
    }
    fs.writeFileSync(saveFile, JSON.stringify(data));
}

function loadSplatnet3DataFromFs(saveFile: PathLike): SplatNet3AuthData {
    if (!fs.existsSync(saveFile)) {
        throw new Error(`File ${saveFile} does not exist.`);
    }
    return JSON.parse(fs.readFileSync(saveFile, "utf-8"));
}