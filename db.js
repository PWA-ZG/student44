
const pg = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new pg.Pool ({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
    //ssl: true
})

async function getSongData(songName) {
    
    const results = await pool.query('SELECT * FROM songs WHERE song_name=$1', [songName])
    
    if(results.rowCount === 0) {
        throw Error("No data for given song name")
    }

    return results.rows[0]
}

async function insertSongData(songName, title = "Unknown", artist = "Unknown", album = "Unknown") {

    await pool.query('INSERT INTO songs VALUES ($1, $2, $3, $4);', [songName, title, artist, album]);
}

module.exports = {
    getSongData,
    insertSongData
}
