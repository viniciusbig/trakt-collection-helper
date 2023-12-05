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

## Commands

`mytrakt summary`
Summary list of all shows inside a path.

`mytrakt get-images`
Get poster images for all show in a path.
This will create a `poster.jpg` file if not present. Use `--force` flag to force images to be downloaded again.

`mytrakt get-info`
Get info metadata about all series in a path. 
This will create a `info.json` file if not present. Use `--force` flag to force info to be downloaded again.

`mytrakt get-episodes`
Get episode metadata about all series in a path. This will create a `episodes.json` file if not present. Use `--force` flag to force info to be downloaded again.