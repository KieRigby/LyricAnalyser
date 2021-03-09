const SpotifyWebApi = require('spotify-web-api-node');
const genius =  require('genius-lyrics-api');

// If running in a development environment fetch keys from .env file
if (process.env.NODE_ENV == "development")
    require('dotenv').config()

const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_API_ID,
    clientSecret: process.env.SPOTIFY_API_SECRET,
});

//Use client credential flow to obtain API access token.
spotify.clientCredentialsGrant().then(
    function(data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        spotify.setAccessToken(data.body['access_token']);

        genius.getLyrics({
            apiKey: process.env.GENIUS_API_TOKEN,
            title: 'Velours',
            artist: 'Anomalie'
        }).then((lyrics) => {
            console.log(lyrics);
        })

    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    }
  );