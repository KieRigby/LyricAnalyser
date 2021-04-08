import spotipy
import os
import time
import pandas as pd

from pathlib import Path
from dotenv import load_dotenv
from spotipy.oauth2 import SpotifyClientCredentials

if "ENV" not in os.environ or os.environ["ENV"] != "production":
    load_dotenv()

spotify = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials())

def load_lyrics_data(data_file):
   lyrics_data = pd.read_csv(data_file)
   del lyrics_data['SLink']
   del lyrics_data['Idiom']
   del lyrics_data['Unnamed: 0']
   lyrics_data["ALink"] = lyrics_data["ALink"].apply(lambda x: x[1:-1].replace('-',' '))
   lyrics_data.columns = ['artist','title','lyrics']
   return lyrics_data

def search_track(song_title, artist):
    search_string = "track:" + song_title + " artist:" + artist

    results = spotify.search(search_string, type='track')
    if len(results['tracks']['items']) > 0: 
        return results['tracks']['items'][0]
    
    return None

def get_audio_features(track_ids):
    return spotify.audio_features(track_ids)

def get_artist_info(artist_ids):
    return spotify.artists(artist_ids)

def return_prop_as_list(input_list, prop):
    return [ item[prop] for item in input_list]

def main():
    lyrics_file = Path("../data/kaggle_english_lyrics_data.csv")
    lyrics_data = load_lyrics_data(lyrics_file)

    track_id = []
    artist_id = []
    duration_ms = []
    explicit = []
    popularity = []

    danceability = []
    energy = []
    loudness = []
    speechiness = []
    acousticness = []
    instrumentalness = []
    liveness = []
    valence = []
    tempo = []

    artist_name = []
    genres = []

    previous_track_array_size = 0
    previous_artist_array_size = 0
    start_index = 0
    end_index = 0

    for index, row in lyrics_data.iterrows():
        track = search_track(row["title"], row["artist"])
        if (track):
            track_id.append(track['id'])
            artist_id.append(track['artists'][0]['id'])
            duration_ms.append(track['duration_ms'])
            explicit.append(track['explicit'])
            popularity.append(track['popularity'])
        else:
            lyrics_data.drop(index, inplace=True)

        # Every 50 tracks do some batch data collection 
        if (not index == 0 and (index + 1) % 50 == 0):
            if previous_artist_array_size != len(artist_id):
                start_index = previous_artist_array_size
                end_index = len(artist_id)
                previous_artist_array_size = len(artist_id)
                artists = get_artist_info(artist_id[start_index : end_index])

                artist_name.extend(return_prop_as_list(artists['artists'], 'name'))
                genres.extend(return_prop_as_list(artists['artists'], 'genres'))

        # Every 100 tracks do some batch data collection
        if (not index == 0 and (index + 1) % 100 == 0):
            if previous_track_array_size != len(track_id):
                start_index = previous_track_array_size
                end_index = len(track_id)
                previous_track_array_size = len(track_id)
                audio_features = get_audio_features(track_id[start_index : end_index])

                danceability.extend(return_prop_as_list(audio_features, 'danceability'))
                energy.extend(return_prop_as_list(audio_features, 'energy'))
                loudness.extend(return_prop_as_list(audio_features, 'loudness'))
                speechiness.extend(return_prop_as_list(audio_features, 'speechiness'))
                acousticness.extend(return_prop_as_list(audio_features, 'acousticness'))
                instrumentalness.extend(return_prop_as_list(audio_features, 'instrumentalness'))
                liveness.extend(return_prop_as_list(audio_features, 'liveness'))
                valence.extend(return_prop_as_list(audio_features, 'valence'))
                tempo.extend(return_prop_as_list(audio_features, 'tempo'))

        # Every 1000 tracks take a 30 second break to avoid rate limiting.
        if (not index == 0 and (index + 1) % 500 == 0):
            print("Sleeping for 30 seconds...")
            print(len(lyrics_data) - index, " tracks remaining...")
            time.sleep(30)


    print("LYRICS DATA LENGTH: ")
    print(len(lyrics_data))

    print("ARRAY LENGTH: ")
    print(len(artist_name))

    lyrics_data['track_id'] = track_id
    lyrics_data['artist_id'] = artist_id
    lyrics_data['duration_ms'] = duration_ms
    lyrics_data['explicit'] = explicit
    lyrics_data['popularity'] = popularity
    lyrics_data['danceability'] = danceability
    lyrics_data['energy'] = energy
    lyrics_data['loudness'] = loudness
    lyrics_data['speechiness'] = speechiness
    lyrics_data['acousticness'] = acousticness
    lyrics_data['instrumentalness'] = instrumentalness
    lyrics_data['liveness'] = liveness
    lyrics_data['valence'] = valence
    lyrics_data['tempo'] = tempo
    lyrics_data['artist_name'] = artist_name
    lyrics_data['genres'] = genres

    dataset_file = Path("../data/lyrics_and_data.csv")
    lyrics_data.to_csv(dataset_file)

if __name__ == "__main__":
    main()