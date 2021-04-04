# LyricAnalyzer

Coursework for the Natural Language Processing course at Surrey.

## Data Collection

Fetching the datasets for this project involves using the Spotify API to gather attributes such as genre, danceability, loudness etc. and the Genius Lyrics API to grab the lyrics for each song.

### Installing dependencies

Firstly, you'll need to install the script's dependencies by running `npm install` in the `scripts` directory.

### Setting up the Spotify API

To connect the script to your Spotify account to collect the data, you need to:

1. Log into the [Spotify Developer Portal](https://developer.spotify.com/).
2. Create an app by going to the [dashboard](https://developer.spotify.com/dashboard/applications).
3. Click on your app to find your *client ID* and *client secret*.
4. In the `scripts/` directory, create a file called `.env` and add the following lines (replacing `<client_id>` and `<client_secret>` with your ID and secret):

``` ()
SPOTIFY_API_ID=<client_id>
SPOTIFY_API_SECRET=<client_secret>
```

### Setting up the Genius API

To connect the Genius API, you will need an access token which can be obtained by:

1. Logging into the [Genius Developer Portal](https://genius.com/signup_or_login).
2. Create an API client by going to the [dashboard](https://genius.com/api-clients/new). **NOTE** - The API Client may require a website to be provided. You can simply use `http://localhost/`.
3. Navigate to your API Client to click on "Generate Access Token".
4. In the `scripts/.env` file, you should add the following line (replacing `<access_token>` with your access token):

```()
GENIUS_API_TOKEN=<access_token>
```

### Running the script

If you are running the script in a development environment (i.e. on your local machine) then you can run the command `npm start` to start the script with nodemon (meaning that any changes made to the script will be picked up and the code will be automatically re-ran).

If you are running the script in a production environment, then you should run the command `npm run fetch` which will tell the script to get the API keys and tokens from environment variables rather than a `.env` file.

At the moment, due to time constraints, the script is ran in batches. The genius API seems to stop working after a large number of requests so we have parameterised the javascript file and use a batch script to call the javascript file in batches of 10 with a delay of 2 minutes in-between. We plan to make this more robust in the future.

The output at the moment will be 5 csv files which need to be merged together somehow. Perhaps a tool like [this](http://merge-csv.com/) works.
