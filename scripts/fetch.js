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

// const csvWriter = createCsvWriter({
//     path: 'output.csv',
//     header: [
//         {id: 'artist', title: 'ARTIST'},
//         {id: 'explicit', title: 'EXPLICIT'},
//         {id: 'id', title: 'ID'},
//         {id: 'name', title: 'NAME'},
//         {id: 'popularity', title: 'POPULARITY'},
//         {id: 'danceability', title: 'DANCEABILITY'},
//         {id: 'energy', title: 'ENERGY'},
//         {id: 'loudness', title: 'LOUDNESS'},
//         {id: 'speechiness', title: 'SPEECHINESS'},
//         {id: 'acousticness', title: 'ACOUSTICNESS'},
//         {id: 'instrumentalness', title: 'INSTRUMENTALNESS'},
//         {id: 'liveness', title: 'LIVENESS'},
//         {id: 'valence', title: 'VALENCE'},
//         {id: 'tempo', title: 'TEMPO'},
//         {id: 'duration_ms', title: 'DURATION_MS'},
//         {id: 'genres', title: 'GENRES'},       
//         {id: 'lyrics', title: 'LYRICS'}       
//     ]
// });

const mainFunction = () => {
    login (authenticated);
};

const login = async (callback) => {
    try{
        const data = await spotify.clientCredentialsGrant();
        callback (data);
    } catch (err) {
        console.error ("Error authenticating user!", err);
    }
};

const authenticated = data => {
    console.log ('The access token expires in ' + data.body['expires_in']);
    console.log ('The access token is ' + data.body['access_token']);
    spotify.setAccessToken (data.body['access_token']);

    getGenreList (processGenreList);
};

const getGenreList = async (callback) => {
    try{
        const data = await spotify.getAvailableGenreSeeds();
        callback (data.body.genres);
    } catch (err) {
        console.error ("Error fetching genre list!", err);
    }
};

const processGenreList = (genres) => {
    //remove blacklisted genres
    //loop over all genres

    getPlaylist (genres[1], processPlaylist)
};

const getPlaylist = async (genre, callback) => {
    try{
        const data = await spotify.searchPlaylists (genre)
        callback (data.body.playlists.items[0].id);
    } catch (err) {
        console.error ("Error fetching playlist!", err);
    }
};

const processPlaylist = (playlist) =>{
    getPlaylistTracks(playlist, processPlaylistTracks)
};

const getPlaylistTracks = async (playlistID, callback) => {
    try{
        const data = await spotify.getPlaylistTracks(playlistID, { limit:50, fields: "items.track(id, name, explicit, popularity, artists(name, id))"});
        callback (data.body.items.map((item)=>{return item.track}));
    } catch (err) {
        console.error ("Error fetching tracks from playlist!", err);
    }
};

const processPlaylistTracks = (tracks) => {
    getAudioFeatures(tracks, processAudioFeaturesForTracks)
};

const getAudioFeatures = async (tracks, callback) => {
    let trackIDs = tracks.map((track)=>{return track.id})
    try{
        const data = await spotify.getAudioFeaturesForTracks(trackIDs);
        callback (data.body.audio_features, tracks);
    } catch (err) {
        console.error ("Error fetching audio features for tracks", err);
    }
};

const processAudioFeaturesForTracks = (features, tracks) => {
    tracks.forEach((track, index) => {
        track.danceability = features[index].danceability
        track.energy = features[index].energy
        track.loudness = features[index].loudness
        track.speechiness = features[index].speechiness
        track.acousticness = features[index].acousticness
        track.instrumentalness = features[index].instrumentalness
        track.liveness = features[index].liveness
        track.valence = features[index].valence
        track.tempo = features[index].tempo
        track.duration_ms = features[index].duration_ms
        track.main_artist = track.artists[0]
        delete track.artists
    });

    getGenreOfArtists(tracks, processGenresFromArtists)
};

const getGenreOfArtists = async (tracks, callback) => {
    let artistIDs = tracks.map((track)=>{return track.main_artist.id});
    try{
        const data = await spotify.getArtists(artistIDs);
        let genres = data.body.artists.map((artist) => {return artist.genres});
        callback (genres, tracks);
    } catch (err) {
        console.error ("Error fetching genres from artists", err);
    }
};

const processGenresFromArtists = (genres, tracks) => {
    tracks.forEach((track, index) => {
        tracks[index].genres = genres[index]
    });
    getLyrics(tracks, processLyrics);
};

const getLyrics = async (tracks, callback) => {
    track_options = [];
    tracks.forEach((track, index) => {
        track_options.push({
            apiKey: process.env.GENIUS_API_TOKEN,
            title: track.name,
            artist: track.main_artist.name,
            optimizeQuery: true
        });
    });
        
    const results = await Promise.all(track_options.map(Genius.getSong));

    let lyrics = results.map((result) => {
        if(result === null || !result.url.includes("lyrics")){
            return null;
        }
    
        return result.lyrics;
    });
    
    callback(tracks, lyrics)
};

const processLyrics = (tracks, lyrics) => {

    tracks.forEach((track, index)=>{
        track.lyrics = lyrics[index];
    });

    tracks = tracks.filter((track) => {
        return (track.lyrics !== null)
    });
    console.log(tracks)


    // console.log(tracks);

    //write to file
};

mainFunction();