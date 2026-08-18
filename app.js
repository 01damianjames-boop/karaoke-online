const songs = [
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

// YouTube player
let youtubePlayer = null;

// Song waiting to be loaded when YouTube API is ready
let pendingSongIndex = null;


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

    document.getElementById("songTitle").textContent =
        song.title;

    document.getElementById("artist").textContent =
        song.artist;

    renderSongs();

    // If YouTube player is not ready yet,
    // remember the song and load it later.
    if (!youtubePlayer) {
        pendingSongIndex = index;
        return;
    }

    youtubePlayer.loadVideoById(song.youtube);
}


/* =========================
   YOUTUBE PLAYER READY
========================= */

function onYouTubePlayerReady(event) {

    // If there is a song waiting to be loaded,
    // load that song.
    if (pendingSongIndex !== null) {

        const index = pendingSongIndex;

        pendingSongIndex = null;

        const song = songs[index];

        event.target.loadVideoById(song.youtube);

        return;
    }

    // Start the first song.
    const song = songs[currentSong];

    event.target.loadVideoById(song.youtube);
}


/* =========================
   YOUTUBE PLAYER STATE
========================= */

function onYouTubePlayerStateChange(event) {

    // YouTube state 0 = ENDED
    if (
        event.data === YT.PlayerState.ENDED
    ) {

        // Small delay prevents accidental
        // double-triggering.
        setTimeout(function () {
            nextSong();
        }, 300);
    }
}


/* =========================
   CREATE YOUTUBE PLAYER
========================= */

function createYouTubePlayer() {

    youtubePlayer =
        new YT.Player("youtubePlayer", {

            videoId: songs[currentSong].youtube,

            playerVars: {
                autoplay: 0,
                rel: 0,
                playsinline: 1
            },

            events: {
                onReady: onYouTubePlayerReady,
                onStateChange: onYouTubePlayerStateChange
            }

        });
}


/* =========================
   NEXT
========================= */

function nextSong() {

    // RESERVED SONGS FIRST
    if (reservedSongs.length > 0) {

        const nextIndex =
            reservedSongs.shift();

        loadSong(nextIndex);

        return;
    }

    // NO RESERVED SONGS
    // Continue normally.
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

    if (!youtubePlayer) {
        return;
    }

    const state =
        youtubePlayer.getPlayerState();

    if (
        state === YT.PlayerState.PLAYING
    ) {

        youtubePlayer.pauseVideo();

    } else {

        youtubePlayer.playVideo();
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

        else if (
            reservedSongs.includes(index)
        ) {

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
   YOUTUBE API CALLBACK
========================= */

window.onYouTubeIframeAPIReady =
    function () {

        createYouTubePlayer();
    };


/* =========================
   START
========================= */

renderSongs();
