const songs = [
    {
        title: "24hour",
        artist: "Karaoke Online",
        file: "songs/24 hour ago - CUESHE (KARAOKE).mp3",

        lyrics: [
            {
                time: 17.20,
                text: `YOUR LYRIC HERE`
            },

            {
                time: 34.80,
                text: `YOUR NEXT LYRIC HERE`
            },

            {
                time: 53.90,
                text: `YOUR NEXT LYRIC HERE`
            }
        ]
    },

    {
        title: "Stay",
        artist: "Karaoke Online",
        file: "songs/Stay - CUESHE (KARAOKE).mp3",

        lyrics: [
            {
                time: 17.20,
                text: `1ST`
            },

            {
                time: 34.80,
                text: `YOUR NEXT STAY LYRIC HERE`
            },

            {
                time: 53.90,
                text: `YOUR NEXT STAY LYRIC HERE`
            }
        ]
    },

    {
        title: "Borrowed Time",
        artist: "Karaoke Online",
        file: "songs/Borrowed time - CUESHE (KARAOKE).mp3",

        lyrics: [
            {
                time: 17.20,
                text: `YOUR LYRIC HERE`
            },

            {
                time: 34.80,
                text: `YOUR NEXT LYRIC HERE`
            },

            {
                time: 53.90,
                text: `YOUR NEXT LYRIC HERE`
            }
        ]
    }
];



/* =========================
   PLAYER VARIABLES
========================= */

let currentSong = -1;

/*
    RESERVED SONGS / QUEUE

    Example:

    24hour = playing

    reserve Stay
    reserve Borrowed Time

    reservedQueue = [1, 2]
*/
let reservedQueue = [];

let currentLyric = -1;



/* =========================
   ELEMENTS
========================= */

const audio = document.getElementById("audioPlayer");

const songTitle =
    document.getElementById("songTitle");

const artist =
    document.getElementById("artist");

const playButton =
    document.querySelector(".controls .play");

const currentTimeDisplay =
    document.getElementById("currentTime");

const durationDisplay =
    document.getElementById("duration");

const progressBar =
    document.getElementById("progressBar");

const searchInput =
    document.getElementById("search");

const songList =
    document.getElementById("songList");

const mainLine =
    document.querySelector(".main-line");

const lyricLines =
    document.querySelectorAll(".lyrics .line");



/* =========================
   UPDATE LYRICS
========================= */

function updateLyrics() {

    if (currentSong === -1) {
        return;
    }

    const lyrics =
        songs[currentSong].lyrics;

    if (!lyrics || lyrics.length === 0) {
        return;
    }

    let newLyric = -1;

    for (let i = 0; i < lyrics.length; i++) {

        if (audio.currentTime >= lyrics[i].time) {

            newLyric = i;

        } else {

            break;
        }
    }

    if (newLyric === -1) {
        return;
    }

    if (newLyric !== currentLyric) {

        currentLyric = newLyric;


        /* MAIN / CURRENT LYRIC */

        if (mainLine) {

            mainLine.textContent =
                lyrics[currentLyric].text;
        }


        /* NEXT LYRIC */

        if (lyricLines[0]) {

            lyricLines[0].textContent =
                lyrics[currentLyric + 1]?.text || "";
        }


        /* NEXT + 1 LYRIC */

        if (lyricLines[1]) {

            lyricLines[1].textContent =
                lyrics[currentLyric + 2]?.text || "";
        }
    }
}



/* =========================
   PLAY SONG
========================= */

function selectSong(index) {

    if (!songs[index]) {
        return;
    }

    currentSong = index;

    const song = songs[index];

    songTitle.textContent =
        song.title;

    artist.textContent =
        song.artist;


    audio.pause();

    audio.src =
        song.file;

    audio.load();


    currentLyric = -1;


    if (mainLine) {
        mainLine.textContent = "";
    }

    if (lyricLines[0]) {
        lyricLines[0].textContent = "";
    }

    if (lyricLines[1]) {
        lyricLines[1].textContent = "";
    }


    /*
        Update song list so the
        reserved status changes.
    */

    createSongList();


    audio.play()
        .then(() => {

            playButton.textContent = "⏸";

        })
        .catch(error => {

            console.error(
                "Play error:",
                error
            );

        });
}



/* =========================
   RESERVE SONG
========================= */

function reserveSong(index) {

    if (!songs[index]) {
        return;
    }


    /*
        If there is NO current song,
        play immediately.
    */

    if (currentSong === -1) {

        selectSong(index);

        return;
    }


    /*
        Don't reserve the song that
        is currently playing.
    */

    if (index === currentSong) {

        console.log(
            "This song is already playing."
        );

        return;
    }


    /*
        Don't add the same song twice.
    */

    if (reservedQueue.includes(index)) {

        console.log(
            "Song is already reserved."
        );

        return;
    }


    /*
        Add song to queue.
    */

    reservedQueue.push(index);


    console.log(
        "Reserved:",
        songs[index].title
    );


    /*
        Refresh list so it shows
        RESERVED.
    */

    createSongList();
}



/* =========================
   CANCEL RESERVATION
========================= */

function cancelReservation(index) {

    const queuePosition =
        reservedQueue.indexOf(index);

    if (queuePosition === -1) {
        return;
    }


    reservedQueue.splice(
        queuePosition,
        1
    );


    console.log(
        "Reservation cancelled:",
        songs[index].title
    );


    createSongList();
}



/* =========================
   PLAY / PAUSE
========================= */

function togglePlay() {

    if (currentSong === -1) {

        selectSong(0);

        return;
    }


    if (audio.paused) {

        audio.play()
            .then(() => {

                playButton.textContent =
                    "⏸";

            })
            .catch(error => {

                console.error(
                    "Play error:",
                    error
                );

            });

    } else {

        audio.pause();

        playButton.textContent =
            "▶";
    }
}



/* =========================
   NEXT SONG
========================= */

function nextSong() {

    /*
        FIRST:
        Check reserved songs.
    */

    if (reservedQueue.length > 0) {

        const nextIndex =
            reservedQueue.shift();


        console.log(
            "Playing reserved song:",
            songs[nextIndex].title
        );


        selectSong(nextIndex);

        return;
    }


    /*
        If there is no reservation,
        go normally to next song.
    */

    if (songs.length === 0) {
        return;
    }


    let nextIndex =
        currentSong + 1;


    if (nextIndex >= songs.length) {

        nextIndex = 0;
    }


    selectSong(nextIndex);
}



/* =========================
   PREVIOUS SONG
========================= */

function previousSong() {

    if (songs.length === 0) {
        return;
    }


    let previousIndex =
        currentSong - 1;


    if (previousIndex < 0) {

        previousIndex =
            songs.length - 1;
    }


    selectSong(previousIndex);
}



/* =========================
   SEARCH
========================= */

function searchSongs() {

    const searchText =
        searchInput.value.toLowerCase();


    const buttons =
        songList.querySelectorAll(".song");


    buttons.forEach(button => {

        const text =
            button.textContent.toLowerCase();


        button.style.display =
            text.includes(searchText)
                ? "block"
                : "none";

    });
}



/* =========================
   AUDIO TIME
========================= */

audio.addEventListener(
    "timeupdate",
    function () {

        currentTimeDisplay.textContent =
            formatTime(
                audio.currentTime
            );


        if (
            audio.duration &&
            !isNaN(audio.duration)
        ) {

            const percentage =
                (
                    audio.currentTime /
                    audio.duration
                ) * 100;


            progressBar.style.width =
                percentage + "%";
        }


        updateLyrics();

    }
);



/* =========================
   CLICK PROGRESS BAR
========================= */

const progress =
    document.querySelector(".progress");


if (progress) {

    progress.addEventListener(
        "click",
        function (event) {

            if (
                !audio.duration ||
                isNaN(audio.duration)
            ) {

                return;
            }


            const rect =
                progress.getBoundingClientRect();


            const clickPosition =
                event.clientX -
                rect.left;


            const percentage =
                clickPosition /
                rect.width;


            audio.currentTime =
                percentage *
                audio.duration;

        }
    );
}



/* =========================
   AUDIO DURATION
========================= */

audio.addEventListener(
    "loadedmetadata",
    function () {

        durationDisplay.textContent =
            formatTime(
                audio.duration
            );

    }
);



/* =========================
   AUDIO END
========================= */

audio.addEventListener(
    "ended",
    function () {

        playButton.textContent =
            "▶";


        /*
            AUTOMATICALLY PLAY
            RESERVED SONG FIRST.
        */

        if (reservedQueue.length > 0) {

            const nextIndex =
                reservedQueue.shift();


            console.log(
                "Auto-playing reserved:",
                songs[nextIndex].title
            );


            selectSong(nextIndex);

            return;
        }


        /*
            If nothing is reserved,
            automatically continue
            to the next song.
        */

        if (songs.length > 0) {

            let nextIndex =
                currentSong + 1;


            if (
                nextIndex >=
                songs.length
            ) {

                nextIndex = 0;
            }


            selectSong(nextIndex);
        }

    }
);



/* =========================
   FORMAT TIME
========================= */

function formatTime(seconds) {

    if (
        !seconds ||
        isNaN(seconds) ||
        !isFinite(seconds)
    ) {

        return "00:00";
    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    const secs =
        Math.floor(
            seconds % 60
        );


    return (
        String(minutes)
            .padStart(2, "0")
        +
        ":"
        +
        String(secs)
            .padStart(2, "0")
    );
}



/* =========================
   CREATE SONG LIST
========================= */

function createSongList() {

    songList.innerHTML = "";


    songs.forEach(
        (song, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "song";


            /*
                CURRENT SONG
            */

            if (index === currentSong) {

                button.innerHTML = `
                    🎤 ${song.title}
                    <span>▶ NOW PLAYING</span>
                `;

                button.style.border =
                    "2px solid #00ff00";

            }


            /*
                RESERVED SONG
            */

            else if (
                reservedQueue.includes(index)
            ) {

                const position =
                    reservedQueue.indexOf(index)
                    + 1;


                button.innerHTML = `
                    🎵 ${song.title}
                    <span>📌 RESERVED #${position}</span>
                `;

                button.style.border =
                    "2px solid #ffaa00";


                /*
                    Clicking a reserved
                    song cancels it.
                */

                button.onclick =
                    function () {

                        cancelReservation(
                            index
                        );

                    };

            }


            /*
                AVAILABLE SONG
            */

            else {

                button.innerHTML = `
                    🎵 ${song.title}
                    <span>
                        ${song.artist}
                        • CLICK TO RESERVE
                    </span>
                `;


                /*
                    IMPORTANT:
                    Clicking does NOT play.

                    It only reserves.
                */

                button.onclick =
                    function () {

                        reserveSong(
                            index
                        );

                    };
            }


            songList.appendChild(
                button
            );

        }
    );
}



/* =========================
   START
========================= */

createSongList();

console.log(
    "Karaoke Online loaded!"
);