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
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showLoginScreen();

    }
);


/* =========================================================
   SHOW LOGIN / APP
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

        /*
         * IMPORTANT:
         * Explicit inline display handling.
         * This prevents GitHub Pages from showing
         * login and app at the same time.
         */

        loginScreen.style.display = "none";

        app.style.display = "block";

        startKaraokeApp();

    } else {

        loginScreen.style.display = "flex";

        app.style.display = "none";

    }

}


/* =========================================================
   LOGIN
========================================================= */

function login() {

    const usernameInput =
        document.getElementById(
            "loginUsername"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    const error =
        document.getElementById(
            "loginError"
        );


    if (!usernameInput || !passwordInput) {
        return;
    }


    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;


    if (
        username === LOGIN_USERNAME &&
        password === LOGIN_PASSWORD
    ) {

        sessionStorage.setItem(
            "karaokeLoggedIn",
            "true"
        );

        isLoggedIn = true;


        if (error) {
            error.textContent = "";
        }


        usernameInput.value = "";
        passwordInput.value = "";


        showLoginScreen();

    } else {

        if (error) {

            error.textContent =
                "❌ Incorrect username or password.";

        }


        passwordInput.value = "";

        passwordInput.focus();

    }

}


/* =========================================================
   LOGIN ENTER KEY
========================================================= */

function handleLoginKey(event) {

    if (
        event.key === "Enter"
    ) {

        event.preventDefault();

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

    youtubePlayer = null;


    const app =
        document.getElementById(
            "appContainer"
        );

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );


    if (app) {
        app.style.display = "none";
    }


    if (loginScreen) {
        loginScreen.style.display = "flex";
    }


    const username =
        document.getElementById(
            "loginUsername"
        );


    if (username) {
        username.focus();
    }

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

    const host =
        document.getElementById(
            "hostApp"
        );

    const remote =
        document.getElementById(
            "remoteApp"
        );


    if (host) {
        host.style.display = "block";
    }


    if (remote) {
        remote.style.display = "none";
    }


    startHostPeer();

    renderSongs();

}


/* =========================================================
   REMOTE START
========================================================= */

function startRemote() {

    const host =
        document.getElementById(
            "hostApp"
        );

    const remote =
        document.getElementById(
            "remoteApp"
        );


    if (host) {
        host.style.display = "none";
    }


    if (remote) {
        remote.style.display = "block";
    }


    startRemotePeer();

}


/* =========================================================
   HOST PEER
========================================================= */

function startHostPeer() {

    if (typeof Peer === "undefined") {

        const status =
            document.getElementById(
                "connectionStatus"
            );

        if (status) {
            status.textContent =
                "🔴 PeerJS unavailable";
        }

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


            generateQRCode(remoteUrl);


            const status =
                document.getElementById(
                    "connectionStatus"
                );


            if (status) {

                status.textContent =
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

                        if (phoneStatus) {

                            phoneStatus.textContent =
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

    if (typeof Peer === "undefined") {

        const status =
            document.getElementById(
                "remoteConnectionStatus"
            );

        if (status) {

            status.textContent =
                "🔴 PeerJS unavailable";

        }

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

                    const status =
                        document.getElementById(
                            "remoteConnectionStatus"
                        );


                    if (status) {

                        status.textContent =
                            "🟢 Connected";

                    }

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

                    const status =
                        document.getElementById(
                            "remoteConnectionStatus"
                        );


                    if (status) {

                        status.textContent =
                            "🔴 Disconnected";

                    }

                }
            );


            hostConnection.on(
                "error",
                function () {

                    const status =
                        document.getElementById(
                            "remoteConnectionStatus"
                        );


                    if (status) {

                        status.textContent =
                            "🔴 Connection Error";

                    }

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


            const status =
                document.getElementById(
                    "remoteConnectionStatus"
                );


            if (status) {

                status.textContent =
                    "🔴 Connection Failed";

            }

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


    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

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

                    fallbackCopy(link);

                }
            );

    } else {

        fallbackCopy(link);

    }

}


/* =========================================================
   FALLBACK COPY
========================================================= */

function fallbackCopy(text) {

    const textarea =
        document.createElement(
            "textarea"
        );


    textarea.value = text;

    textarea.style.position =
        "fixed";

    textarea.style.left =
        "-9999px";


    document.body.appendChild(
        textarea
    );


    textarea.select();


    try {

        document.execCommand(
            "copy"
        );

        alert(
            "📱 Remote link copied!"
        );

    } catch (error) {

        alert(
            "Please copy the remote link manually."
        );

    }


    document.body.removeChild(
        textarea
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

            sendState(connection);

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


    currentSong =
        index;


    const song =
        songs[currentSong];


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


    renderSongs();


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
   YOUTUBE READY
========================================================= */

function onYouTubePlayerReady(event) {

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

    if (
        typeof YT === "undefined"
    ) {

        return;

    }


    const playerElement =
        document.getElementById(
            "youtubePlayer"
        );


    if (!playerElement) {
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


            button.type =
                "button";


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


            button.type =
                "button";


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


            if (!song) {
                return;
            }


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
                    type="button"
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

window.onYouTubeIframeAPIReady =
    function () {

        if (
            !isRemote &&
            isLoggedIn
        ) {

            createYouTubePlayer();

        }

    };
