const SpotifyWebApi = require('spotify-web-api-node');
const Genius =  require('genius-lyrics-api');
const Promise = require("bluebird");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// If running in a development environment fetch keys from .env file
if (process.env.NODE_ENV == "development")
    require('dotenv').config()

const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_API_ID,
    clientSecret: process.env.SPOTIFY_API_SECRET,
});

const args = process.argv.splice(2);

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

const processGenreList = async (genres) => {
    //TODO: remove blacklisted genres

    //TODO: Proper checks here like if start point > end point
    const genreStartPoint = parseInt(args[0]);
    const genreEndPoint = parseInt(args[1]);
    const concurrency = parseInt(args[2]);
    const outputFile = args[3];

    genres = genres.splice(genreStartPoint, genreEndPoint);
    
    const results = await Promise.map(genres, function(genre) {
        // Promise.map awaits for returned promises as well.
        return getPlaylist(genre, processPlaylist);
    }, {concurrency: concurrency});

    const merged = [].concat.apply([], results);
    const filtered = merged.filter((track) => {
        return track != null;
    });

    // const filtered1 = merged.filter((track) => {
    //     return track.main_artist != null;
    // });

    const csvWriter = createCsvWriter({
        path: outputFile,
        header: [
            {id: 'main_artist', title: 'MAIN_ARTIST'},
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

    csvWriter.writeRecords(filtered).then(() => {
        console.log('Written to file ' + outputFile);
    });
};

const getPlaylist = async (genre, callback) => {
    try{
        const data = await spotify.searchPlaylists (genre)
        console.log("Genre: " + genre);
        console.log("Fetching playlist " + data.body.playlists.items[0].name);
        return callback (data.body.playlists.items[0].id);
    } catch (err) {
        console.error ("Error fetching playlist!", err);
    }
};

const processPlaylist = (playlist) =>{
    return getPlaylistTracks(playlist, processPlaylistTracks)
};

const getPlaylistTracks = async (playlistID, callback) => {
    try{
        const data = await spotify.getPlaylistTracks(playlistID, { limit:50, fields: "items.track(id, name, explicit, popularity, artists(name, id))"});
        return callback (data.body.items.map((item)=>{return item.track}));
    } catch (err) {
        console.error ("Error fetching tracks from playlist!", err);
    }
};

const processPlaylistTracks = (tracks) => {
    return getAudioFeatures(tracks, processAudioFeaturesForTracks)
};

const getAudioFeatures = async (tracks, callback) => {
    try{
        let trackIDs = tracks.map((track)=>{return track.id})
        const data = await spotify.getAudioFeaturesForTracks(trackIDs);
        return callback (data.body.audio_features, tracks);
    } catch (err) {
        console.error ("Error fetching audio features for tracks", err);
    }
};

const processAudioFeaturesForTracks = (features, tracks) => {
    tracks = tracks.filter((track) => {
        return (track !== null)
    });

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

    return getGenreOfArtists(tracks, processGenresFromArtists)
};

const getGenreOfArtists = async (tracks, callback) => {
    let artistIDs = tracks.map((track)=>{return track.main_artist.id});
    try{
        const data = await spotify.getArtists(artistIDs);
        let genres = data.body.artists.map((artist) => {return artist.genres});
        return callback (genres, tracks);
    } catch (err) {
        console.error ("Error fetching genres from artists", err);
    }
};

const processGenresFromArtists = (genres, tracks) => {
    tracks.forEach((track, index) => {
        tracks[index].genres = genres[index]
    });
    return getLyrics(tracks, processLyrics);
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
    
    return callback(tracks, lyrics)
};

const processLyrics = (tracks, lyrics) => {

    tracks.forEach((track, index)=>{
        if(lyrics[index] !== null)
            lyrics[index] = lyrics[index].replace(/\n/g, " ");
        track.lyrics = lyrics[index];
        track.main_artist = track.main_artist.name;
    });

    tracks = tracks.filter((track) => {
        return (track.lyrics !== null)
    });
    return tracks;
};

mainFunction();