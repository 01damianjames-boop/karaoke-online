/* =========================================================
   KARAOKE ONLINE
   CONTROL 1 + PHONE CONTROL 2
   AUTO NEXT RESERVED SONG

   VERSION:
   LOCAL HTML5 VIDEO PLAYER

   NO YOUTUBE PLAYER
   NO YOUTUBE ADS

   Put your karaoke videos inside:

   /songs/heaven-knows.mp4
   /songs/back-to-me.mp4
   /songs/24-hours.mp4
   /songs/stay.mp4
   /songs/borrowed-time.mp4
========================================================= */


/* =========================================================
   SONG DATABASE
========================================================= */

const songs = [

    {
        title: "Heaven Knows",
        artist: "Rick Price",
        video: "songs/heaven-knows.mp4"
    },

    {
        title: "Back to me",
        artist: "Cueshe - Karaoke",
        video: "songs/back-to-me.mp4"
    },

    {
        title: "24 Hours",
        artist: "Cueshe - Karaoke",
        video: "songs/24-hours.mp4"
    },

    {
        title: "Stay",
        artist: "Karaoke",
        video: "songs/stay.mp4"
    },

    {
        title: "Borrowed Time",
        artist: "Karaoke",
        video: "songs/borrowed-time.mp4"
    }

];


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentSong = 0;

let reservedSongs = [];

let karaokeVideo = null;

let isPlaying = false;

let isAutoNextRunning = false;


/* =========================================================
   REMOTE / URL STATE
========================================================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const remoteRoom =
    urlParams.get("remote");

const isRemote =
    Boolean(remoteRoom);


/* =========================================================
   PEERJS
========================================================= */

let peer = null;

let hostConnection = null;

let remoteConnections = [];


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (isRemote) {

            startRemote();

        } else {

            startHost();

        }

    }
);


/* =========================================================
   HOST START
========================================================= */

function startHost() {

    document.getElementById(
        "hostApp"
    ).style.display = "block";


    document.getElementById(
        "remoteApp"
    ).style.display = "none";


    karaokeVideo =
        document.getElementById(
            "karaokeVideo"
        );


    if (karaokeVideo) {

        karaokeVideo.addEventListener(
            "ended",
            function () {

                console.log(
                    "🎵 SONG FINISHED"
                );

                isPlaying = false;

                broadcastState();

                automaticNextSong();

            }
        );


        karaokeVideo.addEventListener(
            "play",
            function () {

                isPlaying = true;

                isAutoNextRunning = false;

                broadcastState();

            }
        );


        karaokeVideo.addEventListener(
            "pause",
            function () {

                if (
                    !karaokeVideo.ended
                ) {

                    isPlaying = false;

                    broadcastState();

                }

            }
        );


        karaokeVideo.addEventListener(
            "error",
            function () {

                console.error(
                    "Video error:",
                    karaokeVideo.error
                );

                isPlaying = false;

                const errorMessage =
                    document.getElementById(
                        "videoError"
                    );

                if (errorMessage) {

                    errorMessage.textContent =
                        "⚠️ Video file not found or cannot be played.";

                    errorMessage.style.display =
                        "block";

                }

            }
        );

    }


    startHostPeer();

    renderSongs();

    updateSongDisplay();

}


/* =========================================================
   REMOTE START
========================================================= */

function startRemote() {

    document.getElementById(
        "hostApp"
    ).style.display = "none";


    document.getElementById(
        "remoteApp"
    ).style.display = "block";


    startRemotePeer();

}


/* =========================================================
   HOST PEER
========================================================= */

function startHostPeer() {

    peer = new Peer();


    peer.on(
        "open",
        function (id) {

            const code =
                id.substring(
                    Math.max(
                        0,
                        id.length - 8
                    )
                );


            document.getElementById(
                "roomCode"
            ).textContent =
                code.toUpperCase();


            const remoteUrl =
                window.location.origin +
                window.location.pathname +
                "?remote=" +
                encodeURIComponent(id);


            document.getElementById(
                "remoteLink"
            ).textContent =
                remoteUrl;


            generateQRCode(
                remoteUrl
            );


            document.getElementById(
                "connectionStatus"
            ).textContent =
                "🟢 Room Ready";

        }
    );


    peer.on(
        "connection",
        function (connection) {

            remoteConnections.push(
                connection
            );


            document.getElementById(
                "phoneStatus"
            ).textContent =
                "📱 Phone Connected";


            connection.on(
                "open",
                function () {

                    sendState(
                        connection
                    );

                }
            );


            connection.on(
                "data",
                function (data) {

                    handleRemoteCommand(
                        data
                    );

                }
            );


            connection.on(
                "close",
                function () {

                    remoteConnections =
                        remoteConnections.filter(
                            function (c) {

                                return c !== connection;

                            }
                        );


                    if (
                        remoteConnections.length === 0
                    ) {

                        document.getElementById(
                            "phoneStatus"
                        ).textContent =
                            "📱 No phone connected";

                    }

                }
            );

        }
    );


    peer.on(
        "error",
        function (error) {

            console.error(
                "Peer error:",
                error
            );


            document.getElementById(
                "connectionStatus"
            ).textContent =
                "🔴 Connection Error";

        }
    );

}


/* =========================================================
   REMOTE PEER
========================================================= */

function startRemotePeer() {

    peer = new Peer();


    peer.on(
        "open",
        function () {

            hostConnection =
                peer.connect(
                    remoteRoom
                );


            hostConnection.on(
                "open",
                function () {

                    document.getElementById(
                        "remoteConnectionStatus"
                    ).textContent =
                        "🟢 Connected";

                }
            );


            hostConnection.on(
                "data",
                function (data) {

                    handleHostState(
                        data
                    );

                }
            );


            hostConnection.on(
                "close",
                function () {

                    document.getElementById(
                        "remoteConnectionStatus"
                    ).textContent =
                        "🔴 Disconnected";

                }
            );


            hostConnection.on(
                "error",
                function () {

                    document.getElementById(
                        "remoteConnectionStatus"
                    ).textContent =
                        "🔴 Connection Error";

                }
            );

        }
    );


    peer.on(
        "error",
        function (error) {

            console.error(
                "Remote Peer Error:",
                error
            );


            document.getElementById(
                "remoteConnectionStatus"
            ).textContent =
                "🔴 Connection Failed";

        }
    );

}


/* =========================================================
   QR CODE
========================================================= */

function generateQRCode(url) {

    const qr =
        document.getElementById(
            "qrcode"
        );


    if (!qr) {
        return;
    }


    qr.innerHTML = "";


    if (
        typeof QRCode !== "undefined"
    ) {

        new QRCode(
            qr,
            {
                text: url,
                width: 150,
                height: 150
            }
        );

    }

}


/* =========================================================
   COPY REMOTE LINK
========================================================= */

function copyRemoteLink() {

    const element =
        document.getElementById(
            "remoteLink"
        );


    if (!element) {
        return;
    }


    const link =
        element.textContent;


    if (
        !link ||
        link === "Preparing remote..."
    ) {

        return;

    }


    navigator.clipboard
        .writeText(link)
        .then(
            function () {

                alert(
                    "📱 Remote link copied!"
                );

            }
        )
        .catch(
            function () {

                alert(
                    "Could not copy the link."
                );

            }
        );

}


/* =========================================================
   SEND STATE
========================================================= */

function sendState(connection) {

    if (
        !connection ||
        !connection.open
    ) {

        return;

    }


    connection.send({

        type: "state",

        currentSong:
            currentSong,

        reservedSongs:
            [...reservedSongs],

        isPlaying:
            isPlaying

    });

}


/* =========================================================
   BROADCAST STATE
========================================================= */

function broadcastState() {

    if (isRemote) {
        return;
    }


    remoteConnections.forEach(
        function (connection) {

            sendState(
                connection
            );

        }
    );

}


/* =========================================================
   HANDLE REMOTE COMMAND
========================================================= */

function handleRemoteCommand(data) {

    if (!data) {
        return;
    }


    switch (
        data.type
    ) {

        case "reserve":

            reserveSong(
                data.index
            );

            break;


        case "removeReserve":

            removeReserve(
                data.index
            );

            break;


        case "next":

            nextSong();

            break;


        case "previous":

            previousSong();

            break;


        case "toggle":

            togglePlay();

            break;


        case "load":

            loadSong(
                data.index
            );

            break;

    }

}


/* =========================================================
   HANDLE HOST STATE
========================================================= */

function handleHostState(data) {

    if (
        !data ||
        data.type !== "state"
    ) {

        return;

    }


    currentSong =
        data.currentSong;


    reservedSongs =
        data.reservedSongs || [];


    isPlaying =
        data.isPlaying;


    const song =
        songs[currentSong];


    if (!song) {
        return;
    }


    const title =
        document.getElementById(
            "remoteSongTitle"
        );


    const artist =
        document.getElementById(
            "remoteArtist"
        );


    if (title) {

        title.textContent =
            song.title;

    }


    if (artist) {

        artist.textContent =
            song.artist;

    }


    renderRemoteSongs();

    renderRemoteQueue();

}


/* =========================================================
   REMOTE COMMAND
========================================================= */

function remoteCommand(command) {

    if (
        !hostConnection ||
        !hostConnection.open
    ) {

        return;

    }


    hostConnection.send({

        type: command

    });

}


/* =========================================================
   REMOTE RESERVE
========================================================= */

function remoteReserve(index) {

    if (
        !hostConnection ||
        !hostConnection.open
    ) {

        return;

    }


    hostConnection.send({

        type: "reserve",

        index: index

    });

}


/* =========================================================
   REMOTE REMOVE RESERVE
========================================================= */

function remoteRemoveReserve(index) {

    if (
        !hostConnection ||
        !hostConnection.open
    ) {

        return;

    }


    hostConnection.send({

        type: "removeReserve",

        index: index

    });

}


/* =========================================================
   LOAD SONG
========================================================= */

function loadSong(index) {

    if (
        index < 0
    ) {

        index =
            songs.length - 1;

    }


    if (
        index >= songs.length
    ) {

        index = 0;

    }


    const song =
        songs[index];


    if (!song) {
        return;
    }


    isAutoNextRunning =
        false;


    currentSong =
        index;


    updateSongDisplay();


    renderSongs();


    if (!karaokeVideo) {

        broadcastState();

        return;

    }


    /*
     * Stop current video first.
     */

    karaokeVideo.pause();


    /*
     * Change source.
     */

    karaokeVideo.src =
        song.video;


    /*
     * Start from beginning.
     */

    karaokeVideo.currentTime =
        0;


    /*
     * Load new video.
     */

    karaokeVideo.load();


    /*
     * Try automatic playback.
     */

    const playPromise =
        karaokeVideo.play();


    if (
        playPromise &&
        typeof playPromise.catch === "function"
    ) {

        playPromise.catch(
            function (error) {

                console.log(
                    "Autoplay prevented:",
                    error
                );


                isPlaying =
                    false;


                broadcastState();

            }
        );

    }


    isPlaying = true;


    broadcastState();

}


/* =========================================================
   UPDATE SONG DISPLAY
========================================================= */

function updateSongDisplay() {

    const song =
        songs[currentSong];


    if (!song) {
        return;
    }


    const title =
        document.getElementById(
            "songTitle"
        );


    const artist =
        document.getElementById(
            "artist"
        );


    if (title) {

        title.textContent =
            song.title;

    }


    if (artist) {

        artist.textContent =
            song.artist;

    }


    const remoteTitle =
        document.getElementById(
            "remoteSongTitle"
        );


    const remoteArtist =
        document.getElementById(
            "remoteArtist"
        );


    if (remoteTitle) {

        remoteTitle.textContent =
            song.title;

    }


    if (remoteArtist) {

        remoteArtist.textContent =
            song.artist;

    }

}


/* =========================================================
   AUTOMATIC NEXT
========================================================= */

function automaticNextSong() {

    if (
        isAutoNextRunning
    ) {

        return;

    }


    isAutoNextRunning =
        true;


    console.log(
        "🎵 SONG FINISHED - AUTO NEXT"
    );


    /*
     * RESERVED SONG FIRST
     */

    if (
        reservedSongs.length > 0
    ) {

        const nextIndex =
            reservedSongs.shift();


        console.log(
            "📌 Playing RESERVED:",
            songs[nextIndex].title
        );


        renderSongs();

        broadcastState();


        loadSong(
            nextIndex
        );


        return;

    }


    /*
     * NO RESERVED SONG
     */

    console.log(
        "➡️ No reserve - playing next"
    );


    loadSong(
        currentSong + 1
    );

}


/* =========================================================
   NEXT BUTTON
========================================================= */

function nextSong() {

    isAutoNextRunning =
        false;


    /*
     * RESERVED SONG FIRST
     */

    if (
        reservedSongs.length > 0
    ) {

        const nextIndex =
            reservedSongs.shift();


        console.log(
            "⏭ MANUAL NEXT - RESERVED:",
            songs[nextIndex].title
        );


        renderSongs();

        broadcastState();


        loadSong(
            nextIndex
        );


        return;

    }


    /*
     * NORMAL NEXT
     */

    console.log(
        "⏭ MANUAL NEXT"
    );


    loadSong(
        currentSong + 1
    );

}


/* =========================================================
   PREVIOUS
========================================================= */

function previousSong() {

    isAutoNextRunning =
        false;


    loadSong(
        currentSong - 1
    );

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

    if (!karaokeVideo) {
        return;
    }


    if (
        karaokeVideo.paused ||
        karaokeVideo.ended
    ) {

        const playPromise =
            karaokeVideo.play();


        if (
            playPromise &&
            typeof playPromise.catch === "function"
        ) {

            playPromise.catch(
                function (error) {

                    console.log(
                        "Play prevented:",
                        error
                    );

                }
            );

        }

    } else {

        karaokeVideo.pause();

    }

}


/* =========================================================
   RESERVE SONG
========================================================= */

function reserveSong(index) {

    /*
     * Current song cannot be reserved.
     */

    if (
        index === currentSong
    ) {

        return;

    }


    /*
     * Don't duplicate.
     */

    if (
        reservedSongs.includes(index)
    ) {

        return;

    }


    reservedSongs.push(
        index
    );


    console.log(
        "📌 RESERVED:",
        songs[index].title
    );


    renderSongs();

    broadcastState();

}


/* =========================================================
   REMOVE RESERVE
========================================================= */

function removeReserve(index) {

    reservedSongs =
        reservedSongs.filter(
            function (songIndex) {

                return songIndex !== index;

            }
        );


    renderSongs();

    broadcastState();

}


/* =========================================================
   SEARCH HOST
========================================================= */

function searchSongs() {

    const input =
        document.getElementById(
            "search"
        );


    if (!input) {
        return;
    }


    const search =
        input.value
            .toLowerCase()
            .trim();


    renderSongs(
        search
    );

}


/* =========================================================
   RENDER HOST SONGS
========================================================= */

function renderSongs(
    search = ""
) {

    const list =
        document.getElementById(
            "songList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    songs.forEach(
        function (song, index) {

            const title =
                song.title.toLowerCase();


            const artist =
                song.artist.toLowerCase();


            if (
                !title.includes(search) &&
                !artist.includes(search)
            ) {

                return;

            }


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "song";


            /*
             * CURRENT SONG
             */

            if (
                index === currentSong
            ) {

                button.classList.add(
                    "playing"
                );


                button.innerHTML = `

                    🎤 ${song.title}

                    <span>
                        ▶ NOW PLAYING
                    </span>

                `;


                button.onclick =
                    function () {

                        loadSong(
                            index
                        );

                    };

            }


            /*
             * RESERVED
             */

            else if (
                reservedSongs.includes(
                    index
                )
            ) {

                const reserveNumber =
                    reservedSongs.indexOf(
                        index
                    ) + 1;


                button.classList.add(
                    "reserved"
                );


                button.innerHTML = `

                    🎵 ${song.title}

                    <span>
                        📌 RESERVED #${reserveNumber}
                    </span>

                `;


                button.onclick =
                    function () {

                        removeReserve(
                            index
                        );

                    };

            }


            /*
             * NORMAL
             */

            else {

                button.innerHTML = `

                    🎵 ${song.title}

                    <span>
                        ${song.artist}
                    </span>

                `;


                button.onclick =
                    function () {

                        reserveSong(
                            index
                        );

                    };

            }


            list.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   REMOTE SEARCH
========================================================= */

function searchRemoteSongs() {

    const input =
        document.getElementById(
            "remoteSearch"
        );


    if (!input) {
        return;
    }


    const search =
        input.value
            .toLowerCase()
            .trim();


    renderRemoteSongs(
        search
    );

}


/* =========================================================
   RENDER REMOTE SONGS
========================================================= */

function renderRemoteSongs(
    search = ""
) {

    const list =
        document.getElementById(
            "remoteSongList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    songs.forEach(
        function (song, index) {

            const title =
                song.title.toLowerCase();


            const artist =
                song.artist.toLowerCase();


            if (
                !title.includes(search) &&
                !artist.includes(search)
            ) {

                return;

            }


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "phone-song";


            /*
             * CURRENT
             */

            if (
                index === currentSong
            ) {

                button.classList.add(
                    "playing"
                );


                button.innerHTML = `

                    🎤 ${song.title}

                    <span>
                        ▶ NOW PLAYING
                    </span>

                `;

            }


            /*
             * RESERVED
             */

            else if (
                reservedSongs.includes(
                    index
                )
            ) {

                const number =
                    reservedSongs.indexOf(
                        index
                    ) + 1;


                button.classList.add(
                    "reserved"
                );


                button.innerHTML = `

                    🎵 ${song.title}

                    <span>
                        📌 RESERVED #${number}
                        • Tap to remove
                    </span>

                `;


                button.onclick =
                    function () {

                        remoteRemoveReserve(
                            index
                        );

                    };

            }


            /*
             * NORMAL
             */

            else {

                button.innerHTML = `

                    🎵 ${song.title}

                    <span>
                        ${song.artist}
                        • Tap to reserve
                    </span>

                `;


                button.onclick =
                    function () {

                        remoteReserve(
                            index
                        );

                    };

            }


            list.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   REMOTE QUEUE
========================================================= */

function renderRemoteQueue() {

    const queue =
        document.getElementById(
            "remoteQueue"
        );


    if (!queue) {
        return;
    }


    queue.innerHTML = "";


    if (
        reservedSongs.length === 0
    ) {

        queue.textContent =
            "No reserved songs";

        return;

    }


    reservedSongs.forEach(
        function (
            index,
            position
        ) {

            const song =
                songs[index];


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "queue-item";


            item.innerHTML = `

                <strong>
                    #${position + 1}
                </strong>

                <span>
                    ${song.title}
                </span>

                <button
                    onclick="remoteRemoveReserve(${index})">
                    ✕
                </button>

            `;


            queue.appendChild(
                item
            );

        }
    );

}