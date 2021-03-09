if (process.env.NODE_ENV == "development")
    require('dotenv').config()


console.log(process.env.SPOTIFY_API_ID)
console.log(process.env.SPOTIFY_API_SECRET)