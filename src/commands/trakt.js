import { readdirSync, statSync, existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import trakt from 'trakt.tv';
import MData from 'mdata';
import pkg from 'enquirer';
import { table } from 'table';
import { exit } from 'process';
import dotenv from 'dotenv';
const { Select, prompt } = pkg;

// load .env
dotenv.config();

const traktOptions = {
    client_id: process.env.TRAKT_CLIENT_ID,
    client_secret: process.env.TRAKT_CLIENT_SECRET,
    debug: (process.env.TRACK_DEBUG_MODE == "true") ? true : false,
};

const mdataOptions = {
    fanart: process.env.FANART_API_KEY,
    tmdb: process.env.TMDB_API_KEY,
    tvdb: process.env.TVDB_API_KEY,
    omdb: process.env.OMDB_API_KEY,
};

// create a new trake client
const traktClient = new trakt(traktOptions);

// create a new mdata client
const mdata = new MData(mdataOptions);

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

/**
 * Create a file with json content in a path
 * 
 * @param {string} fileName
 * @param {object} content 
 * @returns 
 */
const createMetaFile = (fileName, content) => {
    return writeFileSync(fileName, JSON.stringify(content, null, 4), {
        encoding: "utf8",
    });
}

/**
 * Read meta data from file
 * @param {string} fileName 
 * @returns object
 */
const readMetaFile = (fileName) => {
    return JSON.parse(readFileSync(fileName));
}

/**
 * Check if path already have a poster image
 * 
 * @param {string} dirPath 
 * @returns 
 */
const hasPoster = dirPath => {
    const file = path.join(dirPath, 'poster.jpg');
    return existsSync(file);
}

/**
 * Check if path already have an episode file
 * 
 * @param {string} dirPath 
 * @returns 
 */
const hasEpisodes = dirPath => {
    const file = path.join(dirPath, 'episodes.json');
    return existsSync(file);
}

const removeShow = dirPath => {
    const file = path.join(dirPath, 'info.json');
    return unlinkSync(file);
}

// todo - fix
const getAllFiles = function(dirPath, arrayOfFiles) {
    let files = readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(dirPath, "/", file);
        }
    })

    return arrayOfFiles;
}

async function downloadFile(url, dirPath, fileName) {
    const response = await fetch(url);
    const buffer = await response.buffer();

    const file = path.join(dirPath, fileName);
    return writeFileSync(file, buffer);
}

/**
 * Creates a list of all shows inside a folder.
 * 
 * This assume that `dirPath` is a directory with one directory for each TV Show
 * 
 *  ```
 *      /example/series/
 *          Breaking Bad/
 *              Season 01/
 *                  S01E01/
 *                  S01E02/
 *                  ...
 *          Lost/
 *              Season 01/
 *                  S01E01/
 *                  S01E02/
 *                  ...
 * 
 * Output a table with all shows listed
 * 
 * @param {string} dirPath 
 * @param {*} options 
 */
async function summary(dirPath, options) {

    // start timmer
    console.time("summary");

    // ready all folders with full path
    let files = readdirSync(dirPath).map(fileName => {
            return path.join(dirPath, fileName)
        })
        .filter(isDirectory)            // just add folders
        .filter(isNotCommonFolder)      // remove common folders
        .filter(isNotIgnored);          // remove if TV show is marked as ignore

    let dataTable = [];

    const tableConfig = {
        header: {
            alignment: 'center',
            content: `All shows in ${dirPath}`,
        },
    }

    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    // If you want to read the files in sequence, you cannot use forEach indeed.
    // Just use a modern for … of loop instead, in which await will work as expected:
    for (const file of files) {

        let showName = path.basename(file);
        let traktId = null;

        if (isNotShow(file)) {
            continue;
        }

        const metaFile = readMetaFile(path.join(file, 'info.json'));
        // console.log(metaFile);

        dataTable.push([
            metaFile.title,
            metaFile.year,
            metaFile.status,
            metaFile.aired_episodes,
            `https://trakt.tv/shows/${metaFile.ids.slug}`,
        ]);
    }

    console.log(table(dataTable, tableConfig));

    // stop timmer
    console.timeEnd("summary");
}

/**
 * Search in Trakt.tv and create a info.json file with metadata for all series in a path
 * 
 * @param {string} dirPath 
 * @param {*} options 
 */
async function getInfoOnTraktTv(dirPath, options) {

    // start timmer
    console.time("trakt-info");

    // ready all folders with full path
    let files = readdirSync(dirPath).map(fileName => {
            return path.join(dirPath, fileName)
        })
        .filter(isDirectory)            // just add folders
        .filter(isNotCommonFolder)      // remove common folders
        .filter(isNotIgnored);          // remove if TV show is marked as ignore

    if (!options.force) {
        // filter folders without a match show (a `info.json` file)
        files = files.filter(isNotShow);
    }

    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    // If you want to read the files in sequence, you cannot use forEach indeed.
    // Just use a modern for … of loop instead, in which await will work as expected:
    for (const file of files) {

        let showName = path.basename(file);
        let traktId = null;

        if (options.remove && isShow(file)) {
            console.log(`Removing info.json from ${file}`);
            removeShow(file);
            continue;
        }

        // Select traktId for this show from file, or from a search in trakt.tv
        if (isNotShow(file)) {

            // get search from trakt
            const searchResults = await traktClient.search.text({
                query: showName,
                type: 'show'
            });

            if (searchResults.length == 0) {
                console.error(`No show named ${showName} found`);
                continue;
            }
            
            // map results
            const showOptions = searchResults.map(show => {
                return {
                    name: show.show.ids.trakt,
                    message: show.show.title + " (" + show.show.year + ")",
                    hint: "https://trakt.tv/shows/" + show.show.ids.slug,
                };
            });

            // prompt user
            const prompt = new Select({
                name: 'show',
                message: `Select the correct show for the search: ${showName}`,
                choices: showOptions
            });

            traktId = await prompt.run();

        } else {
            // get trakdID from file
            const meta = readMetaFile(path.join(file, 'info.json'));
            traktId = meta.ids.trakt;
        }

        // get full showObject
        const showData = await traktClient.shows.summary({
            id: traktId,
            extended: 'full'
        });

        console.log('Saving ' + path.join(file, 'info.json'));
        createMetaFile(path.join(file, 'info.json'), showData);
    }

    // stop timmer
    console.timeEnd("trakt-info");
}

/**
 * Get a poster image for all series in a path
 * 
 * @param {string} dirPath 
 * @param {object} options 
 */
async function getImages(dirPath, options) {

    // start timmer
    console.time("get-images");

    // ready all folders with full path
    let files = readdirSync(dirPath).map(fileName => {
            return path.join(dirPath, fileName)
        })
        .filter(isDirectory)            // just add folders
        .filter(isNotCommonFolder)      // remove common folders
        .filter(isNotIgnored)           // remove if TV show is marked as ignore
        .filter(isShow);                // just add folders with `info.json`

    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    // If you want to read the files in sequence, you cannot use forEach indeed.
    // Just use a modern for … of loop instead, in which await will work as expected:
    for (const file of files) {

        let showName = path.basename(file);

        if (hasPoster(file) && !options.force) {
            console.log(`${showName} already have a poster, skipping`);
            continue;
        }

        // get trakdID from file
        const meta = readMetaFile(path.join(file, 'info.json'));

        // Using trakt.tv-images `https://github.com/vankasteelj/trakt.tv-images`
        // let showImages = await traktClient.images.get({
        //     //tmdb: meta.ids.tmdb, // optional, recommended
        //     //imdb: meta.ids.imdb, // starts with 'tt' prefix, recommended
        //     tvdb: meta.ids.tvdb, // optional, recommended
        //     type: 'show' // can be 'movie', 'show' or 'episode', person
        // }, false);

        let showImages = {};

        try {
            // Using MData `https://github.com/vankasteelj/mdata/`
            showImages = await mdata.images.show({ 
                // imdb: meta.ids.imdb,
                // tmdb: meta.ids.tmdb,
                tvdb: meta.ids.tvdb,
                // fanart: meta.ids.imdb,
                // omdb: <your api key></your>
            });
        } catch (e) {
            // console.log(e);
            console.log(`${showName} doesn't have any image available`);
        }

        if (showImages.poster) {
            console.log(showImages.poster);
            let poster = await downloadFile(showImages.poster, file, 'poster.jpg');
            console.log(`${showName} poster downloaded`);
        } else {
            console.log(`${showName} doesn't have a poster available`);
        }
    }

    // stop timmer
    console.timeEnd("get-images");
}

/**
 * Get the episodes list from Trakt.tv and save it in `episodes.json`
 * 
 * @param {string} dirPath 
 * @param {object} options 
 */
async function getEpisodes(dirPath, options) {

    // start timmer
    console.time("get-episodes");

    // ready all folders with full path
    let files = readdirSync(dirPath).map(fileName => {
            return path.join(dirPath, fileName)
        })
        .filter(isDirectory)
        .filter(isNotCommonFolder)
        .filter(isNotIgnored)
        .filter(isShow);

    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    // If you want to read the files in sequence, you cannot use forEach indeed.
    // Just use a modern for … of loop instead, in which await will work as expected:
    for (const file of files) {

        let showName = path.basename(file);
        let traktId = null;

        if (hasEpisodes(file) && !options.force) {
            console.log(`${showName} already have a episodes, skipping`);
            continue;
        }

        // get trakdID from file
        const meta = readMetaFile(path.join(file, 'info.json'));
        traktId = meta.ids.trakt;

        // get full showObject
        const showData = await traktClient.seasons.summary({
            id: traktId,
            extended: 'episodes'
        });

        createMetaFile(path.join(file, 'episodes.json'), showData.data);
        console.log(`${showName} episodes saved`);
    }

    // stop timmer
    console.timeEnd("get-episodes");
}

async function login() {

    const tokenFile = './.token.json';

    if (existsSync(tokenFile)) {
        restoreSession();
        console.log('You are already logged in');
        return true;
    }

    let token = await traktClient.get_codes().then(poll => {
        // poll.verification_url: url to visit in a browser
        // poll.user_code: the code the user needs to enter on trakt
        console.log(`Open the URL ${poll.verification_url} and type the code ${poll.user_code}`)

        // verify if app was authorized
        return traktClient.poll_access(poll);
    }).catch(error => {
        // error.message == 'Expired' will be thrown if timeout is reached
        console.log(error.message);
        exit;
    });

    // get token, store it safely.
    const token2 = traktClient.export_token();

    createMetaFile(tokenFile, token2);
    console.log('You are logged in');
}

async function logout() {
    traktClient.revoke_token();

    const tokenFile = './.token.json';
    unlinkSync(tokenFile);

    console.log(`You where logged out`);
}

async function restoreSession() {

    const tokenFile = './.token.json';

    if (existsSync(tokenFile)) {
        console.log("Reading current token");
        // read from file
        let token = readMetaFile(tokenFile);
        // injects back stored token on new session.
        let newToken = await traktClient.import_token(token);

        if (token.access_token != newToken.access_token) {
            console.log("Refreshing token");
            createMetaFile(tokenFile, newToken);
        }
    }
}

export { summary, getInfoOnTraktTv, getImages, getEpisodes, login, logout };