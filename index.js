#!/usr/bin/env node

import cli from "commander";
import dotenv from 'dotenv';
import * as trakt from "./commands/search.js"

// load .env
dotenv.config();

cli.description("Syncronize my local series collection with traks.tv");
cli.name("mytrakt");
cli.usage("<command>");
cli.addHelpCommand(false);
cli.helpOption(false);

cli
    .command("summary")
    .argument("<path>", "Path with all series folder.")
    .description(
        "Summary list of all shows inside a folder"
    )
    .action(trakt.summary);

cli
    .command("get-images")
    .argument("<path>", "Path with all series folder.")
    .option("-f, --force", "Force update images from Trakt")
    .description(
        "Get poster images for all show in a path."
    )
    .action(trakt.getImages);

cli
    .command("get-info")
    .argument("<path>", "Path with all series folder.")
    .option("-f, --force", "Force update metadata from Trakt")
    .description(
        "Get info metadata about all series in a path"
    )
    .action(trakt.getInfoOnTraktTv);

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



cli.parse(process.argv);