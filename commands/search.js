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
 * @param {string} dirPath 
 * @returns 
 */
const hasPoster = dirPath => {
    const file = path.join(dirPath, 'poster.jpg');
    return existsSync(file);
}

const hasEpisodes = dirPath => {
    const file = path.join(dirPath, 'episodes.json');
    return existsSync(file);
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

async function summary(dirPath, options) {

    console.log("iniciando");

    // ready all folders with full path
    let files = readdirSync(dirPath).map(fileName => {
            return path.join(dirPath, fileName)
        })
        .filter(isDirectory)
        .filter(isNotCommonFolder)
        .filter(isNotIgnored);

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
        console.log(metaFile);

        dataTable.push([
            metaFile.title,
            metaFile.year,
            metaFile.status,
            metaFile.aired_episodes,
            `https://trakt.tv/shows/${metaFile.ids.slug}`,
        ]);
    }

    console.log(table(dataTable, tableConfig));

    console.log("finalizando");
}

async function getInfoOnTraktTv(dirPath, options) {

    console.log("iniciando");

    // ready all folders with full path
    let files = readdirSync(dirPath).map(fileName => {
            return path.join(dirPath, fileName)
        })
        .filter(isDirectory)
        .filter(isNotCommonFolder)
        .filter(isNotIgnored);

    if (!options.force) {
        // filter folders without a match show
        files = files.filter(isNotShow);
    }

    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    // If you want to read the files in sequence, you cannot use forEach indeed.
    // Just use a modern for … of loop instead, in which await will work as expected:
    for (const file of files) {

        let showName = path.basename(file);
        let traktId = null;

        if (isNotShow(file)) {

            // get search from trakt
            const searchResults = await traktClient.search.text({
                query: showName,
                type: 'show'
            });

            // map results
            const showOptions = searchResults.data.map(show => {
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

        console.log(showName);

        createMetaFile(path.join(file, 'info.json'), showData.data);
    }

    console.log("finalizando");
}

async function getImages(dirPath, options) {

    console.log("iniciando");

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

        if (hasPoster(file) && !options.force) {
            console.log(`${showName} already have a poster, skipping`);
            continue;
        }

        // get trakdID from file
        const meta = readMetaFile(path.join(file, 'info.json'));

        // get images 

        // let showImages = await traktClient.images.get({
        //     //tmdb: meta.ids.tmdb, // optional, recommended
        //     //imdb: meta.ids.imdb, // starts with 'tt' prefix, recommended
        //     tvdb: meta.ids.tvdb, // optional, recommended
        //     type: 'show' // can be 'movie', 'show' or 'episode', person
        // }, false);
        let showImages = await mdata.images.show({ imdb: meta.ids.imdb });

        if (showImages.poster) {
            let poster = await downloadFile(showImages.poster, file, 'poster.jpg');
            console.log(`${showName} poster downloaded`);
        } else {
            console.log(`${showName} doesn't have a poster available`);
        }
    }

    console.log("finalizando");
}

async function getEpisodes(dirPath, options) {

    console.log("iniciando");

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

        console.log(`Downloading episodes from ${showName}`);

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

    console.log("finalizando");
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
            createMetaFile(tokenFile, token2);
        }
    }
}

export { summary, getInfoOnTraktTv, getImages, getEpisodes, login, logout };