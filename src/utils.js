import { statSync, existsSync } from 'fs';
import path from 'path';

/**
 * Check if a path is a directory
 * @param {string} dirPath 
 * @returns 
 */
const isDirectory = dirPath => {
    return statSync(dirPath).isDirectory()
}

/**
 * Check if a path is a file
 * 
 * @param {string} dirPath 
 * @returns 
 */
const isFile = dirPath => {
    return statSync(dirPath).isFile()
}

/**
 * Check is a path is a reserved one
 * @param {string} dirPath 
 * @returns 
 */
const isNotCommonFolder = dirPath => {
    return !dirPath.includes("$RECYCLE.BIN") &&
        !dirPath.includes("System Volume Information") &&
        !dirPath.includes(".Trash");
}

const isNotCommonFiles = dirPath => {
    return !dirPath.includes(".DS_Store");
}

/**
 * Check if a TV show show be ignored loocking into info.json file
 * and checking for a key `ignore` .
 * 
 * @param {string} dirPath 
 * @returns 
 */
const isNotIgnored = dirPath => {
    if (isShow(dirPath)) {
        const meta = readMetaFile(path.join(dirPath, 'info.json'));
        return !("ignore" in meta);
    }
    return true;
}

/**
 * Check if path already has a match with trakt.tv
 * @param {string} dirPath 
 * @returns 
 */
const isShow = dirPath => {
    const file = path.join(dirPath, 'info.json');
    return existsSync(file);
}

const isNotShow = dirPath => {
    return !isShow(dirPath);
}

export { isDirectory, isFile, isNotCommonFolder, isNotCommonFiles, isNotIgnored, isShow, isNotShow };