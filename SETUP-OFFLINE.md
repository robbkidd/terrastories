# Setup
This setup is for use in a production environment which is completely offline. A very small number of people will need to use this. Generally you can just follow [SETUP.md](SETUP.md)

## Table of Contents

1. [Docker prerequisites](#docker-prerequisites)

2. [Setup and running the server: Linux or Mac](#setup-and-running-the-server-linux-or-mac)

3. [Setup and running the server: Windows](#setup-and-running-the-server-windows)

4. [Creating (and updating) the Map](#creating-and-updating-the-map)

5. [Instructions for setting up an offline computer](#instructions-for-setting-up-an-offline-computer)

6. [Importing data into Terrastories](#importing-data-into-terrastories)

7. [Adding languages to Terrastories](#adding-languages-to-terrastories)

## Docker Prerequisites

Install docker. On linux, you may have to install docker-compose separately.

 - https://docs.docker.com/install/
 - https://docs.docker.com/compose/install/

On Windows, all terminal docker commands need to be run using Windows PowerShell, not Command Prompt.
PowerShell comes with Windows.

## Setup and running the server: Linux or Mac

This project uses these [GitHub conventions](https://github.com/github/scripts-to-rule-them-all)
to provide convenient scripts for developers.

On a fresh clone of this repo, run:

```
$ script/setup
```

This will download and build all the docker images used in this project. It will
also build the map tile data supporting the tileserver service. This step can
take a long time complete. Its output should end with something like the
following, which will eventually get to 100%, I promise.

```
...
> wwww features, xxxx bytes of geometry, yyyy bytes of separate metadata,
zzzz bytes of string pool
> 99.9% 11/2222/3333
```

### Make It Go

Just run:

```
$ script/server
```

Use `ctrl-c` to stop.

(Alternatively, the server can be started in detached mode with `script/start`.
In that case, stop it with `script/stop`.)

Once rails fully starts up, you can view the running app at `localhost:3000`
or an alternative port specified in `.env` if one exists. See `.env.example` for
available options and reasonable starting values.

To monitor the console output from just the rails app and not the other docker
containers, run:

```
$ script/logs
```

### Updating the App

After a `git pull` or any time ruby gems or node modules may have changed, run:

```
$ script/update
```

Then restart the app with `script/server` (or `script/start`).

### Development

Most developer contributions will be focused on the rails app. Because this project uses
docker, we already have a uniform ruby/rails development environment in our rails docker
image. Any time you need to run a rails command you should do so from a running docker
container to take advantage of this consistent environment. Use the following command to
open a bash console on the rails container:

```
$ script/console
```

Now you can treat this console like any other development environment, running rails or
bundler commands as needed. **Please refrain from running such commands in your local
environment. Always use the rails container instead.**

Any changes to source files should be made directly in your local filesystem under the
`/rails` directory using your preferred editing tools.

## Setup and running the server: Windows

### Step 1: build the app

In your terminal program, navigate to the directory where you put the `terrastories-minimal` 
files, after you've downloaded it. You always have to be in this directory to run any of the docker
commands. Run `docker-compose-build`.

Docker will automatically build images as needed when running `docker-compose build`,
but to confirm everything builds correctly, run the following and check that the
output ends with something like this.
```
$ docker-compose build
  ...
> mariadb uses an image; skipping
  ...
> Successfully built 0123456789
> Successfully tagged terrastories/tilebuilder:latest
> tileserver uses an image; skipping
```

### Step 2: build the map tiles

The tilebuilder service will need to be run once to populate the `mbtiles`
shared volume that the tileserver will read from. The tilebuilder does not need
to stay running along with the other services. Building map tiles may take quite
a long time, but it should show progress similar to the following and eventually
get to 100%, exiting with code 0.
```
$ docker-compose run tilebuilder
...
> wwww features, xxxx bytes of geometry, yyyy bytes of separate metadata,
zzzz bytes of string pool
> 99.9% 11/2222/3333
```

Any time the shapefiles change and require regenerating the mbtiles file,
this service will need to be run again and the tileserver restarted once the
tilebuilder finishes (just run `docker-compose restart tileserver`).

### Step 3: Make It Go

In `docker-compose.yml`, the tileserver service is listed
as dependencies for the nginx service. So to start the whole thing up
(omitting tilebuilder, which only needs to run once) just run the following.
```
$ docker-compose up -d nginx
```

Once the service fully starts up, you can view tileserver running at `localhost:3000`
or an alternative port specified in `.env` if one exists. See `.env.example` for
available options and reasonable starting values. 

To view a map equipped with bookmarks and other customizations, visit `localhost:3000/map/`.

Omit the `-d` flag if you prefer to see the nginx server output. You can always
tail the output of any service with `docker-compose logs`. 

To spin all the services back down run the following.
```
$ docker-compose down
```

## Creating (and updating) the Map

### Step 1: preparing content in Mapbox Studio

Terrastories is designed to render a basemap as designed and styled in Mapbox Studio. There are two different components: shapefiles (the spatial data without any styling properties) and styles (the look and feel of the map, as designed in Mapbox Studio, exported in json format). The basic workflow is as follows:

1) upload the shapefile content to [Mapbox Studio](https://www.mapbox.com/mapbox-studio/), and use the Studio interface to lay out the map. You have to have a Mapbox account to use Mapbox Studio (creating and designing maps using Mapbox Studio is free up to certain file size limitations). To learn how to use Mapbox Studio, you can refer to the manuals and tutorials made available by Mapbox [here](https://www.mapbox.com/help/studio-manual-tutorials/) or other resources on the web.

2) download the style.json from Mapbox Studio via the Mapbox Studio styles interface [here](https://www.mapbox.com/studio/styles/)

3) copy both the shapefiles and style.json into the respective directories on Terrastories. Do not rename shapefiles or feature names in Mapbox Studio throughout this process -- the naming conventions must be consistent (aside from the additional -###### hash added by Mapbox Studio; more on that later).

Note: the user must provide their own shapefile content. It is not possible to use any of the standard OpenStreetMap (OSM) content used in the standard styles made available by Mapbox, unless the user first downloads that OSM content and converts it to shapefile first.

### Step 2: adding new or updating shapefiles to Terrastories

To add new shapefiles or update existing shapefiles, there are two steps:

1) Include the new files in your `shapefile` directory (\tilebuilder\shapefiles])

2) You will need to re-run the tilebuilder, following the instructions here: https://github.com/rubyforgood/terrastories/blob/master/tilebuilder/README.md

### Step 3: adding or updating style to the Map

To add or update the map style,

1) download the style.json from Mapbox Studio via the Mapbox Studio styles interface [here](https://www.mapbox.com/studio/styles/)

2) at this point, we have to edit the style.json a little. When you upload shapefiles to Mapbox Studio, it actually adds on an additional six alphanumeric characters preceded by a dash (-), which is called "hash." For example, a shapefile called "South_America" might be called "South_America-a2027z" in Mapbox Studio. And then in style.json file, all of the names for this layer will have "–a2027z" added to it. This is a problem because there is a discrepancy between the names of the shapefile you added in Step 2, which does no include "-a2027z." So, you have to go into the json and look for "source-layer": "South_America-a2027z", and take out the "-a2027z", and do the same for each layer.

*In the future, we will create an automatic script that will take care of this process.*

3) copy the style into your `styles` directory (tileserver\data\styles])

4) make sure that config.json in \tileserver\data\ is pointing to the right style file.

## Instructions for setting up an offline computer

Under construction: https://gist.github.com/kalimar/ed14b5d026220ee5cd81d416b4f67b7b#file-matawai-nuc-md

## Importing data into Terrastories

In the Terrastories back end, it is possible to import data in bulk using a CSV importer.

The data should be imported in the following order: Places, Speakers, and then Stories.

To prepare CSVs for importing, use the following workflow to ensure that character diacritics are properly imported:

-If the file is already an .xlsx, go to Google Sheets and File->Import from the menu. Then import the file.
-Otherwise create the file directly in Google Sheets. Make sure the file has a row for headers.
-Go to File -> Download As-> Comma Separated Values, and save the file to your machine.
-This CSV should be properly encoded as UTF-8. It's best to verify this with Notepad++ instead of Excel if you are on a Windows machine.

## Adding languages to Terrastories

Terrastories uses internationalization to translate the application's core text, like the welcome page, sidebar, and administrative back end content. We have made it easy to add new languages to Terrastories without needing to touch any of the code.

To add a language to Terrastories, navigate to the `rails/config/locales/` directory. Within this directory, each language has it's own subdirectory, like `en` (English) or `pt` (Portuguese). Currently, there are three files in each (using Portuguese as an example):

 1. `pt.yml`
 2. `devise.pt.yml`
 3. `administrate.pt.yml`

`pt.yml` contains the custom text used in the Terrastories application. `devise.pt.yml` and `administrative.pt.yml` are used by the administrative back end.

To set up a new language, create a new subdirectory in the `locales` folder. Let's assume you want to set up Papiamentu. Create a subdirectory called `pap` and copy over `en.yml` from the `en` folder. Rename it to `pap.yml`, change line 32 to `pap`, and translate each line of text in what follows.

For the `devise` and `administrate` files, there might be available translations already available online for common Western languages. If so, you can download these and place them in the directory, and make sure that the language code is consistent (for languages like Spanish and Portuguese, the language code might sometimes have a country-specific suffix like `pt-BR`). If translations are not available, do the same thing with these two files as translating `en.yml`.

If you want to change the default language for Terrastories, set the language on line 21 in `rails/config/application.rb`. To set it to Papiamentu, change this line to `config.i18n.default_locale = :pap`

Once you are done, the language should be available the next time you start Terrastories.
