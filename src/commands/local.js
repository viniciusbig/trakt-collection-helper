import { readdirSync, mkdirSync } from 'fs';
import { moveSync } from 'fs-extra/esm';
import path from 'path';
import parser from 'episode-parser';
import { isFile, isNotCommonFiles, isNotIgnored } from '../utils.js';

/**
 * For a folder with all episodes inside, create and move files 
 * to the correct Show, Season and Episode Folders.
 * 
 * @param {string} dirPath 
 * @returns 
 */
const createFolders = dirPath => {
    
    // start timmer
    console.time("create-folders");

    // ready all folders with full path
    let files = readdirSync(dirPath).map(fileName => {
            return path.join(dirPath, fileName)
        })
        .filter(isFile)                 // just add files
        .filter(isNotCommonFiles)      // remove common folders
        .filter(isNotIgnored);          // remove if TV show is marked as ignore

    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    // If you want to read the files in sequence, you cannot use forEach indeed.
    // Just use a modern for … of loop instead, in which await will work as expected:
    for (const file of files) {

        let showName = path.basename(file);
        let baseDir = path.dirname(file);
        let parsedInfo = parser(showName);

        // Create the folder to hold that files
        let folderName = [];
        if (parsedInfo.show) {
            folderName.push(parsedInfo.show);
            if (parsedInfo.season) {
                let season  = parsedInfo.season.toString().padStart(2, '0');
                folderName.push(`Season ${season}`);
                if (parsedInfo.episode) {
                    let episode  = parsedInfo.episode.toString().padStart(2, '0');
                    folderName.push(`S${season}E${episode}`);
                }
            }
        }

        if (folderName.length == 0) {
            continue;
        }

        folderName = folderName.join('/');
        let finalFolderPath = path.join(baseDir, folderName);
        let source = file;
        let destination = path.join(finalFolderPath, showName);

        mkdirSync(finalFolderPath, { recursive: true });
        moveSync(source, destination);
    }
    
    // stop timmer
    console.timeEnd("create-folders");
}

export { createFolders };

