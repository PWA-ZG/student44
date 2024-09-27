const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const fse = require('fs-extra');
const db = require('./db.js');
const exp = require("constants");
const cors = require('cors');

const httpPort = 80;    

const app = express();
// app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.h tml"));
});


const AUDIO_UPLOAD_PATH = path.join(__dirname, "records", "audio");
const IMG_UPLOAD_PATH = path.join(__dirname, "records", "img");

app.use('/records/audio', express.static(AUDIO_UPLOAD_PATH));
app.use('/records/img', express.static(IMG_UPLOAD_PATH));

var uploadSongs = multer({
    storage:  multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, AUDIO_UPLOAD_PATH);
        },
        filename: function (req, file, cb) {
            let fn = req.body.title.toLowerCase().replaceAll(" ", "_") + ".mp3";
            cb(null, fn);
        },
    })
}).single("song");

var uploadImages = multer({
    storage:  multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, IMG_UPLOAD_PATH);
        },
        filename: function (req, file, cb) {
            let fn = req.body.title.toLowerCase().replaceAll(" ", "_") + ".jpg";
            cb(null, fn);
        },
    })
}).single("image");

app.post("/saveSong",  function (req, res) {
    uploadSongs(req, res, async function(err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                error: {
                    message: 'Upload failed:: ' + JSON.stringify(err)
                }
            });
        } else {
            console.log(req.body);
            res.json({ success: true, title: req.body.title });
        }
    });
});

app.post("/saveImg", function(req, res) {
    uploadImages(req, res, async function(err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                error: {
                    message: 'Upload failed:: ' + JSON.stringify(err)
                }
            });
        } else {
            console.log(req.body);
            res.json({ success: true, title: req.body.title });
        }
    });
})


app.get("/records", function(req, res) {

    let files = fse.readdirSync(AUDIO_UPLOAD_PATH);

    files = files.reverse();

    res.json({
        files
    });
})

app.get("/record/:id", async function(req, res) {

    let id = req.params.id;
    let data;

    try {
        data = await db.getSongData(id)
    } catch(err) {
        data = {
            songName: id,
            title: "Unknown",
            artist: "Unknown",
            album: "Unknown"
        }
    }

    res.json(data);
})

app.listen(httpPort, function () {
    console.log(`HTTP listening on port: ${httpPort}`);
});