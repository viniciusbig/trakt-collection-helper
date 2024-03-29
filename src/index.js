#!/usr/bin/env node

import cli from "commander";
import dotenv from "dotenv";
import figlet from "figlet";
import * as trakt from "./commands/trakt.js"
import * as local from "./commands/local.js"

console.log(figlet.textSync("MyTrakt"));

// load .env
dotenv.config();

cli.description("Helper methods to handle my media library in my local environment. It also connects to trakt.tv to syncronize episodes");
cli.name("mytrakt");
cli.usage("<command>");
// do not want Commander to add the default help command to our CLI/
cli.addHelpCommand(false);
// remove the built-in -h or --help option flag
cli.helpOption(false);

cli
    .command("summary")
    .argument("<path>", "Path with all series folder.")
    .description(
        "Creates a list of all shows inside a folder"
    )
    .action(trakt.summary);

cli
    .command("get-info")
    .argument("<path>", "Path with all series folder.")
    .option("-r, --remove", "Remove current info.json so we can start over")
    .option("-f, --force", "Force update metadata from Trakt")
    .description(
        "Search in Trakt.tv and create a info.json file with metadata for all series in a path"
    )
    .action(trakt.getInfoOnTraktTv);

cli
    .command("get-images")
    .argument("<path>", "Path with all series folder.")
    .option("-f, --force", "Force update images from Trakt")
    .description(
        "Get poster images for all show in a path."
    )
    .action(trakt.getImages);

cli
    .command("get-episodes")
    .argument("<path>", "Path with all series folder.")
    .option("-f, --force", "Force update metadata from Trakt")
    .description(
        "Get episode metadata about all series in a path"
    )
    .action(trakt.getEpisodes);

cli
    .command("login")
    .description(
        "Login on Trakt API"
    )
    .action(trakt.login);

cli
    .command("logout")
    .description(
        "Logout from Trakt API"
    )
    .action(trakt.logout);

cli
    .command("create-folders")
    .argument("<path>", "Path for a folder with all episodes.")
    .description(
        "Create folders for shows, series and episodes based on the file name. Move everything to the correct place. Usefull for the torrent folder."
    )
    .action(local.createFolders);

cli.parse(process.argv);