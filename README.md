# LyricAnalyzer

Coursework for the Natural Language Processing course at Surrey.

## Data Collection

Fetching the datasets for this project involves using the Spotify API to gather attributes such as genre, danceability, loudness etc. and the Genius Lyrics API to grab the lyrics for each song.

### Installing dependencies

Firstly, you'll need to install the script's dependencies by running `npm install` in the `scripts` directory.

### Setting up the Spotify API

To connect the script to your Spotify account to collect the data, you need to:

1. Log in to the [Spotify Developer Portal](https://developer.spotify.com/).
2. Create an application by going to the [dashboard](https://developer.spotify.com/dashboard/applications).
3. Click on your app to find your *client ID* and *client secret*.
4. In the `scripts/` directory, create a file called `.env` and add the following lines (replacing `<client_id>` and `<client_secret>` with your id and secret):

``` ()
SPOTIFY_API_ID=<client_id>
SPOTIFY_API_SECRET=<client_secret>
```

### Setting up the Genius API

//TODO

### Running the script

If you are running the script in a development environment (i.e. on your local machine) then you can run the command `npm start` to start the script with nodemon (meaning that any changes made to the script will be picked up and the code will be automatically re-ran).

If you are running the script in a production environment, then you should run the command `npm run fetch` which will tell the script to get the API keys and tokens from environment variables rather than a `.env` file.
