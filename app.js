/* =========================================================
   KARAOKE ONLINE
   LOGIN + CONTROL 1 + PHONE CONTROL 2
========================================================= */


/* =========================================================
   LOGIN SETTINGS
========================================================= */

const LOGIN_USERNAME = "admin";
const LOGIN_PASSWORD = "Karaoke123!";


/* =========================================================
   LOGIN STATE
========================================================= */

let isLoggedIn =
    sessionStorage.getItem("karaokeLoggedIn") === "true";


/* =========================================================
   SONG DATABASE
========================================================= */

const songs = [

    {
        title: "Heaven Knows",
        artist: "Rick Price",
        youtube: "m7o9fbTsRuc"
    },

    {
        title: "Back to me",
        artist: "Cueshe - Karaoke",
        youtube: "jNYXQLWlk6k"
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


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentSong = 0;

let reservedSongs = [];

let youtubePlayer = null;

let pendingSongIndex = null;

let isPlaying = false;


/* =========================================================
   YOUTUBE API STATE
========================================================= */

/*
   IMPORTANT:
   The YouTube API may become ready BEFORE login.
   We remember that it is ready, then create the player
   after the user logs in.
*/

let youtubeApiReady = false;


/* =========================================================
   REMOTE / PEER STATE
========================================================= */

const urlParams =
    new URLSearchParams(window.location.search);

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
   LOGIN
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showLoginScreen();

    }
);


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLoginScreen() {

    const loginScreen =
        document.getElementById("loginScreen");

    const app =
        document.getElementById("appContainer");

    if (!loginScreen || !app) {
        return;
    }


    if (isLoggedIn) {

        loginScreen.style.display = "none";

        app.style.display = "block";

        startKaraokeApp();

    } else {

        loginScreen.style.display = "flex";

        app.style.display = "none";

    }

}


/* =========================================================
   LOGIN FUNCTION
========================================================= */

function login() {

    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;


    const error =
        document.getElementById("loginError");


    if (
        username === LOGIN_USERNAME &&
        password === LOGIN_PASSWORD
    ) {

        sessionStorage.setItem(
            "karaokeLoggedIn",
            "true"
        );

        isLoggedIn = true;

        error.textContent = "";

        document.getElementById(
            "loginUsername"
        ).value = "";

        document.getElementById(
            "loginPassword"
        ).value = "";

        showLoginScreen();

    } else {

        error.textContent =
            "❌ Incorrect username or password.";

        document
            .getElementById("loginPassword")
            .value = "";

    }

}


/* =========================================================
   LOGIN ENTER KEY
========================================================= */

function handleLoginKey(event) {

    if (
        event.key === "Enter"
    ) {

        login();

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmLogout) {
        return;
    }


    sessionStorage.removeItem(
        "karaokeLoggedIn"
    );

    isLoggedIn = false;


    if (peer) {

        try {
            peer.destroy();
        } catch (error) {
            console.log(error);
        }

        peer = null;

    }


    remoteConnections = [];

    hostConnection = null;


    /*
       Properly destroy the YouTube player
       before logging out.
    */

    if (
        youtubePlayer &&
        typeof youtubePlayer.destroy === "function"
    ) {

        try {
            youtubePlayer.destroy();
        } catch (error) {
            console.log(
                "YouTube destroy error:",
                error
            );
        }

    }


    youtubePlayer = null;

    pendingSongIndex = null;

    isPlaying = false;


    document.getElementById(
        "appContainer"
    ).style.display = "none";


    document.getElementById(
        "loginScreen"
    ).style.display = "flex";


    document.getElementById(
        "loginUsername"
    ).focus();

}


/* =========================================================
   START KARAOKE APP
========================================================= */

function startKaraokeApp() {

    if (!isLoggedIn) {
        return;
    }


    if (isRemote) {

        startRemote();

    } else {

        startHost();

    }

}


/* =========================================================
   HOST START
========================================================= */

function startHost() {

    document.getElementById("hostApp").style.display =
        "block";

    document.getElementById("remoteApp").style.display =
        "none";

    startHostPeer();

    renderSongs();


    /*
       FIX:
       If YouTube API is already ready because it loaded
       before login, create the player NOW.
    */

    initializeYouTubePlayer();

}


/* =========================================================
   REMOTE START
========================================================= */

function startRemote() {

    document.getElementById("hostApp").style.display =
        "none";

    document.getElementById("remoteApp").style.display =
        "block";

    startRemotePeer();

}


/* =========================================================
   INITIALIZE YOUTUBE PLAYER
========================================================= */

function initializeYouTubePlayer() {

    /*
       Remote phone does NOT need the YouTube player.
    */

    if (isRemote) {
        return;
    }


    /*
       User must be logged in.
    */

    if (!isLoggedIn) {
        return;
    }


    /*
       Do not create the player twice.
    */

    if (youtubePlayer) {
        return;
    }


    /*
       Wait until YouTube API is ready.
    */

    if (
        !youtubeApiReady ||
        typeof YT === "undefined" ||
        typeof YT.Player === "undefined"
    ) {

        console.log(
            "YouTube API not ready yet."
        );

        return;

    }


    const playerElement =
        document.getElementById(
            "youtubePlayer"
        );


    if (!playerElement) {

        console.log(
            "YouTube player element not found."
        );

        return;

    }


    console.log(
        "Creating YouTube player..."
    );


    createYouTubePlayer();

}


/* =========================================================
   HOST PEER
========================================================= */

function startHostPeer() {

    /*
       Prevent creating multiple Peer connections
       after repeated login/logout.
    */

    if (peer) {
        return;
    }


    peer = new Peer();


    peer.on(
        "open",
        function (id) {

            const code =
                id.substring(
                    Math.max(0, id.length - 8)
                );


            const roomCode =
                document.getElementById(
                    "roomCode"
                );


            if (roomCode) {

                roomCode.textContent =
                    code.toUpperCase();

            }


            const remoteUrl =
                window.location.origin +
                window.location.pathname +
                "?remote=" +
                encodeURIComponent(id);


            const remoteLink =
                document.getElementById(
                    "remoteLink"
                );


            if (remoteLink) {

                remoteLink.textContent =
                    remoteUrl;

            }


            generateQRCode(
                remoteUrl
            );


            const connectionStatus =
                document.getElementById(
                    "connectionStatus"
                );


            if (connectionStatus) {

                connectionStatus.textContent =
                    "🟢 Room Ready";

            }

        }
    );


    peer.on(
        "connection",
        function (connection) {

            remoteConnections.push(
                connection
            );


            const phoneStatus =
                document.getElementById(
                    "phoneStatus"
                );


            if (phoneStatus) {

                phoneStatus.textContent =
                    "📱 Phone Connected";

            }


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
                            c => c !== connection
                        );


                    if (
                        remoteConnections.length === 0
                    ) {

                        const status =
                            document.getElementById(
                                "phoneStatus"
                            );


                        if (status) {

                            status.textContent =
                                "📱 No phone connected";

                        }

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


            const status =
                document.getElementById(
                    "connectionStatus"
                );


            if (status) {

                status.textContent =
                    "🔴 Connection Error";

            }

        }
    );

}


/* =========================================================
   REMOTE PEER
========================================================= */

function startRemotePeer() {

    if (peer) {
        return;
    }


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
   GENERATE QR
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

    const link =
        document.getElementById(
            "remoteLink"
        ).textContent;


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
        );

}


/* =========================================================
   SEND STATE TO ONE REMOTE
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


    switch (data.type) {

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


    document.getElementById(
        "remoteSongTitle"
    ).textContent =
        song.title;


    document.getElementById(
        "remoteArtist"
    ).textContent =
        song.artist;


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
   REMOTE REMOVE
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

    if (index < 0) {

        index =
            songs.length - 1;

    }


    if (index >= songs.length) {

        index = 0;

    }


    currentSong = index;


    const song =
        songs[currentSong];


    document.getElementById(
        "songTitle"
    ).textContent =
        song.title;


    document.getElementById(
        "artist"
    ).textContent =
        song.artist;


    renderSongs();


    /*
       If player is not ready yet,
       remember the requested song.
    */

    if (!youtubePlayer) {

        pendingSongIndex =
            index;

        broadcastState();

        return;

    }


    youtubePlayer.loadVideoById(
        song.youtube
    );


    isPlaying = false;

    broadcastState();

}


/* =========================================================
   YOUTUBE PLAYER READY
========================================================= */

function onYouTubePlayerReady(event) {

    console.log(
        "YouTube player is ready."
    );


    if (
        pendingSongIndex !== null
    ) {

        const index =
            pendingSongIndex;


        pendingSongIndex =
            null;


        const song =
            songs[index];


        event.target.loadVideoById(
            song.youtube
        );


    } else {

        const song =
            songs[currentSong];


        event.target.loadVideoById(
            song.youtube
        );

    }


    isPlaying = false;

    broadcastState();

}


/* =========================================================
   YOUTUBE STATE
========================================================= */

function onYouTubePlayerStateChange(event) {

    if (
        typeof YT === "undefined"
    ) {
        return;
    }


    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        isPlaying = true;

        broadcastState();

    }


    if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {

        isPlaying = false;

        broadcastState();

    }


    if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        isPlaying = false;

        broadcastState();


        setTimeout(
            function () {

                nextSong();

            },
            300
        );

    }

}


/* =========================================================
   CREATE YOUTUBE PLAYER
========================================================= */

function createYouTubePlayer() {

    if (youtubePlayer) {
        return;
    }


    if (
        typeof YT === "undefined" ||
        typeof YT.Player === "undefined"
    ) {

        console.log(
            "Cannot create YouTube player yet."
        );

        return;

    }


    const playerElement =
        document.getElementById(
            "youtubePlayer"
        );


    if (!playerElement) {

        console.log(
            "youtubePlayer element missing."
        );

        return;

    }


    youtubePlayer =
        new YT.Player(
            "youtubePlayer",
            {

                videoId:
                    songs[currentSong].youtube,

                playerVars: {

                    autoplay: 0,

                    rel: 0,

                    playsinline: 1

                },

                events: {

                    onReady:
                        onYouTubePlayerReady,

                    onStateChange:
                        onYouTubePlayerStateChange

                }

            }
        );

}


/* =========================================================
   NEXT
========================================================= */

function nextSong() {

    if (
        reservedSongs.length > 0
    ) {

        const nextIndex =
            reservedSongs.shift();


        loadSong(
            nextIndex
        );


        renderSongs();

        broadcastState();

        return;

    }


    loadSong(
        currentSong + 1
    );

}


/* =========================================================
   PREVIOUS
========================================================= */

function previousSong() {

    loadSong(
        currentSong - 1
    );

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

    if (!youtubePlayer) {

        console.log(
            "YouTube player is not ready."
        );

        return;

    }


    if (
        typeof YT === "undefined"
    ) {

        return;

    }


    const state =
        youtubePlayer.getPlayerState();


    if (
        state ===
        YT.PlayerState.PLAYING
    ) {

        youtubePlayer.pauseVideo();


    } else {

        youtubePlayer.playVideo();

    }

}


/* =========================================================
   RESERVE
========================================================= */

function reserveSong(index) {

    if (
        index === currentSong
    ) {

        return;

    }


    if (
        reservedSongs.includes(index)
    ) {

        return;

    }


    reservedSongs.push(
        index
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
            songIndex =>
                songIndex !== index
        );


    renderSongs();

    broadcastState();

}


/* =========================================================
   SEARCH HOST
========================================================= */

function searchSongs() {

    const search =
        document
            .getElementById(
                "search"
            )
            .value
            .toLowerCase();


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

            if (

                !song.title
                    .toLowerCase()
                    .includes(search)

                &&

                !song.artist
                    .toLowerCase()
                    .includes(search)

            ) {

                return;

            }


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "song";


            /* CURRENT */

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


            /* RESERVED */

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


            /* NORMAL */

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

    const search =
        document
            .getElementById(
                "remoteSearch"
            )
            .value
            .toLowerCase();


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

            if (

                !song.title
                    .toLowerCase()
                    .includes(search)

                &&

                !song.artist
                    .toLowerCase()
                    .includes(search)

            ) {

                return;

            }


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "phone-song";


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
        function (index, position) {

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


/* =========================================================
   YOUTUBE CALLBACK
========================================================= */

/*
   IMPORTANT FIX:

   The API can become ready before login.

   We set youtubeApiReady = true,
   then call initializeYouTubePlayer().

   If the user is still on the login screen,
   initializeYouTubePlayer() simply waits.

   After login, startHost() calls it again.
*/

window.onYouTubeIframeAPIReady =
    function () {

        console.log(
            "YouTube IFrame API is ready."
        );


        youtubeApiReady = true;


        initializeYouTubePlayer();

    };