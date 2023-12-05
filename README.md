# Trakt.tv collection helper

Series of helpers commands to organize my personal collection of TV Series with data from [Trakt.tv](https://trakt.tv/)

This script assumes we have a root folder with all Series and inside of each Serie, a folder for each Season and then, a folder for each Episode. 

```
/Breaking Bad/
    Season 01/
        /S01E01/S01E01.mp4
        /S01E01/S01E01.str
        /S01E02/S01E02.mp4
        /S01E02/S01E02.str
    Season 02/
        /...
```

## Install

There is no publick package for this yet.
Clone the repo and type

```bash
npm install
npm link
```

After that the command `mytrakt` should be available for any folder.

## Commands

`mytrakt summary`

Summary list of all shows inside a path.
Usefull to list all Series in a folder or External Driver.

`mytrakt get-info`

Get info metadata about all series in a path. 
This will create a `info.json` file if not present. 
Use `--force` flag to force info to be downloaded again.

`mytrakt get-images`

Get poster images for all show in a path.
This will create a `poster.jpg` file if not present. Use `--force` flag to force images to be downloaded again.

`mytrakt get-episodes`

Get episode metadata about all series in a path. This will create a `episodes.json` file if not present. Use `--force` flag to force info to be downloaded again.

## References

- https://cheatcode.co/tutorials/how-to-build-a-command-line-interface-cli-using-node-js
- https://www.twilio.com/pt-br/blog/como-criar-uma-cli-com-node-js
- https://developer.okta.com/blog/2019/06/18/command-line-app-with-nodejs
- https://reintech.io/blog/how-to-use-nodejs-to-create-a-command-line-interface

## Libraries

- https://github.com/vankasteelj/trakt.tv
- https://github.com/vankasteelj/mdata/
    - https://github.com/Ivshti/video-name-parser
- https://github.com/vankasteelj/trakt.tv-matcher (to be implemented)
- https://github.com/vankasteelj/trakt.tv-images (to be implemented)
- https://github.com/tregusti/episode-parser (not implemented) **
- https://github.com/scttcper/video-filename-parser (not implemented) **