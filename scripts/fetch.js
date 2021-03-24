const SpotifyWebApi = require('spotify-web-api-node');
const Genius =  require('genius-lyrics-api');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// If running in a development environment fetch keys from .env file
if (process.env.NODE_ENV == "development")
    require('dotenv').config()

const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_API_ID,
    clientSecret: process.env.SPOTIFY_API_SECRET,
});

const csvWriter = createCsvWriter({
    path: 'output.csv',
    header: [
        {id: 'artist', title: 'ARTIST'},
        {id: 'explicit', title: 'EXPLICIT'},
        {id: 'id', title: 'ID'},
        {id: 'name', title: 'NAME'},
        {id: 'popularity', title: 'POPULARITY'},
        {id: 'danceability', title: 'DANCEABILITY'},
        {id: 'energy', title: 'ENERGY'},
        {id: 'loudness', title: 'LOUDNESS'},
        {id: 'speechiness', title: 'SPEECHINESS'},
        {id: 'acousticness', title: 'ACOUSTICNESS'},
        {id: 'instrumentalness', title: 'INSTRUMENTALNESS'},
        {id: 'liveness', title: 'LIVENESS'},
        {id: 'valence', title: 'VALENCE'},
        {id: 'tempo', title: 'TEMPO'},
        {id: 'duration_ms', title: 'DURATION_MS'},
        {id: 'genres', title: 'GENRES'},       
        {id: 'lyrics', title: 'LYRICS'}       
    ]
});

//Use client credential flow to obtain API access token.
spotify.clientCredentialsGrant().then(
    function(data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        spotify.setAccessToken(data.body['access_token']);

        // Get available genre seeds
        spotify.getAvailableGenreSeeds()
        .then(function(data) {
            let genres = data.body.genres;

            // Remove genres which aren't to be processed (eg acoustic)
            
            spotify.searchPlaylists(genres[0])
            .then(function(data) {
                let playlistID = data.body.playlists.items[0].id;

                spotify.getPlaylistTracks(playlistID, {
                    fields: "items.track(id, name, explicit, popularity, artists(name, id))"
                }).then(function(data){
                    // fetch: id, name, explicitness, popularity, artists
                    let tracks = data.body.items.map((item)=>{return item.track})
                    // console.log(tracks)
                    let trackIDs = tracks.map((track)=>{return track.id})

                    /* Get Audio Features for several tracks */
                    spotify.getAudioFeaturesForTracks(trackIDs)
                    .then(function(data) {
                        features = data.body.audio_features;
                        tracks.forEach((track, index) => {
                            tracks[index].danceability = features[index].danceability
                            tracks[index].energy = features[index].energy
                            tracks[index].loudness = features[index].loudness
                            tracks[index].speechiness = features[index].speechiness
                            tracks[index].acousticness = features[index].acousticness
                            tracks[index].instrumentalness = features[index].instrumentalness
                            tracks[index].liveness = features[index].liveness
                            tracks[index].valence = features[index].valence
                            tracks[index].tempo = features[index].tempo
                            tracks[index].duration_ms = features[index].duration_ms

                            let artistIDs = track.artists.map((artist) => {return artist.id})

                            spotify.getArtists(artistIDs)
                            .then(function(data){
                                let unmerged_genres = data.body.artists.map((artist) => {return artist.genres});
                                let genres = [].concat.apply([], unmerged_genres);
                                tracks[index].genres = genres

                                const options = {
                                    apiKey: process.env.GENIUS_API_TOKEN,
                                    title: track.name,
                                    artist: track.artists[0].name,
                                    optimizeQuery: false
                                };
                                
                                Genius.getLyrics(options)
                                .then(function(lyrics){
                                    tracks[index].lyrics = lyrics;
                                    tracks[index].artist = tracks[index].artists[0].name
                                    delete tracks[index].artists

                                    console.log(tracks[index].artist)

                                    if(index == tracks.length - 1) {
                                        csvWriter.writeRecords(tracks)
                                        .then(() => {
                                            console.log('...LOL');
                                        });
                                    }

                                    setTimeout(() => {  console.log("Waiting!"); }, 5000);
                                    
                                }, function (err){
                                    console.error("Something went wrong getting the lyrics", err)
                                });

                            }, function(err){
                                console.error("Something went wrong getting the artist's genre", err)
                            })
                        })
                    }, function(err) {
                        console.error("Something went wrong getting audio features for tracks in playlist", err);
                    });
                    
                }, function(err) {
                    console.error("Something went wrong getting tracks from playlist", err)
                });  

            }, function(err) {
                console.error('Something went wrong searching for genre playlist!', err);
            });

        }, function(err) {
            console.error('Something went wrong retrieving genres!', err);
        });
    },
    function(err) {
      console.error('Something went wrong when retrieving an access token', err);
    }
);
    

