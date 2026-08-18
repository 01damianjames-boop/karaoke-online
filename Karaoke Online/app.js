const songs = [
    {
        title: "Ulan",
        artist: "Cueshe - Karaoke",
        youtube: "MMZQ8WkF2vI"
    },

    {
        title: "Pangako",
        artist: "Cueshe - Karaoke",
        youtube: "N0l7F-PtTwU"
    },


    {
        title: "24 Hours",
        artist: "Cueshe - Karaoke",
        youtube: "BiKU79XjelQ"
    },

    {
        title: "Stay",
        artist: "Karaoke",
        youtube: "ymalJ5AMH4U"
    },

    {
        title: "Borrowed Time",
        artist: "Karaoke",
        youtube: "feskSn7ZI6Y"
    }
];

let currentSong = 0;

// RESERVED SONGS
let reservedSongs = [];


/* =========================
   LOAD SONG
========================= */

function loadSong(index) {

    if (index < 0) {
        index = songs.length - 1;
    }

    if (index >= songs.length) {
        index = 0;
    }

    currentSong = index;

    const song = songs[currentSong];

    document.getElementById("songTitle").textContent = song.title;
    document.getElementById("artist").textContent = song.artist;

    const player =
        document.getElementById("youtubePlayer");

    player.src =
        "https://www.youtube.com/embed/" +
        song.youtube +
        "?autoplay=1&rel=0";

    renderSongs();
}


/* =========================
   NEXT
========================= */

function nextSong() {

    // If there are reserved songs,
    // play the first reserved song.

    if (reservedSongs.length > 0) {

        const nextIndex = reservedSongs.shift();

        loadSong(nextIndex);

        return;
    }

    loadSong(currentSong + 1);
}


/* =========================
   PREVIOUS
========================= */

function previousSong() {

    loadSong(currentSong - 1);
}


/* =========================
   PLAY / PAUSE
========================= */

function togglePlay() {

    const player =
        document.getElementById("youtubePlayer");

    if (!player.src) {
        loadSong(currentSong);
        return;
    }

    if (player.src.includes("autoplay=1")) {

        player.src =
            player.src.replace(
                "autoplay=1",
                "autoplay=0"
            );

    } else {

        player.src =
            player.src.replace(
                "autoplay=0",
                "autoplay=1"
            );
    }
}


/* =========================
   RESERVE SONG
========================= */

function reserveSong(index) {

    // Don't allow the currently playing
    // song to be reserved again.

    if (index === currentSong) {
        return;
    }

    // Don't reserve the same song twice.

    if (reservedSongs.includes(index)) {
        return;
    }

    // ADD TO RESERVE QUEUE
    reservedSongs.push(index);

    renderSongs();
}


/* =========================
   REMOVE RESERVE
========================= */

function removeReserve(index) {

    reservedSongs =
        reservedSongs.filter(
            songIndex => songIndex !== index
        );

    renderSongs();
}


/* =========================
   SEARCH SONGS
========================= */

function searchSongs() {

    const search =
        document
            .getElementById("search")
            .value
            .toLowerCase();

    renderSongs(search);
}


/* =========================
   RENDER SONG LIST
========================= */

function renderSongs(search = "") {

    const list =
        document.getElementById("songList");

    list.innerHTML = "";

    songs.forEach((song, index) => {

        if (
            !song.title
                .toLowerCase()
                .includes(search) &&
            !song.artist
                .toLowerCase()
                .includes(search)
        ) {
            return;
        }

        const button =
            document.createElement("button");

        button.className = "song";


        /* =====================
           CURRENT SONG
        ===================== */

        if (index === currentSong) {

            button.style.border =
                "2px solid #00ff55";

            button.style.boxShadow =
                "0 0 10px rgba(0,255,80,0.25)";

            button.innerHTML = `
                🎤 ${song.title}
                <span>
                    ▶ NOW PLAYING
                </span>
            `;

            button.onclick = function () {
                loadSong(index);
            };
        }


        /* =====================
           RESERVED SONG
        ===================== */

        else if (reservedSongs.includes(index)) {

            const reserveNumber =
                reservedSongs.indexOf(index) + 1;

            button.style.border =
                "2px solid #ffcc00";

            button.style.boxShadow =
                "0 0 10px rgba(255,204,0,0.20)";

            button.innerHTML = `
                🎵 ${song.title}
                <span style="color:#ffcc00;">
                    📌 RESERVED #${reserveNumber}
                </span>
            `;

            button.onclick = function () {
                removeReserve(index);
            };
        }


        /* =====================
           NORMAL SONG
        ===================== */

        else {

            button.innerHTML = `
                🎵 ${song.title}
                <span>
                    ${song.artist}
                </span>
            `;

            button.onclick = function () {
                reserveSong(index);
            };
        }

        list.appendChild(button);
    });
}


/* =========================
   START
========================= */

renderSongs();