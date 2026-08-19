/* =========================================================
   KARAOKE ONLINE
   CONTROL 1 + PHONE REMOTE
   QUEUE / RESERVE + AUTO PLAY
========================================================= */

const LOGIN_USERNAME = "admin";
const LOGIN_PASSWORD = "Karaoke123!";

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

let currentSong = null;

let reservedSongs = [];

let youtubePlayer = null;

let pendingSongIndex = null;

let isPlaying = false;

let youtubeApiReady = false;


/* =========================================================
   REMOTE / PEER
========================================================= */

const urlParams =
    new URLSearchParams(window.location.search);

const remoteRoom =
    urlParams.get("remote");

const isRemote =
    Boolean(remoteRoom);

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
   LOGIN
========================================================= */

function login() {

    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();

    const password =
        document.getElementById("loginPassword").value;

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

        document.getElementById(
            "loginPassword"
        ).value = "";

    }
}


function handleLoginKey(event) {

    if (event.key === "Enter") {
        login();
    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    if (
        !confirm(
            "Are you sure you want to logout?"
        )
    ) {
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

    if (
        youtubePlayer &&
        typeof youtubePlayer.destroy === "function"
    ) {

        try {
            youtubePlayer.destroy();
        } catch (error) {
            console.log(error);
        }
    }

    youtubePlayer = null;

    pendingSongIndex = null;

    currentSong = null;

    reservedSongs = [];

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
   START APP
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
   HOST
========================================================= */

function startHost() {

    document.getElementById("hostApp").style.display =
        "block";

    document.getElementById("remoteApp").style.display =
        "none";

    startHostPeer();

    renderSongs();

    initializeYouTubePlayer();
}


/* =========================================================
   REMOTE
========================================================= */

function startRemote() {

    document.getElementById("hostApp").style.display =
        "none";

    document.getElementById("remoteApp").style.display =
        "block";

    startRemotePeer();
}


/* =========================================================
   YOUTUBE INITIALIZE
========================================================= */

function initializeYouTubePlayer() {

    if (isRemote) {
        return;
    }

    if (!isLoggedIn) {
        return;
    }

    if (youtubePlayer) {
        return;
    }

    if (
        !youtubeApiReady ||
        typeof YT === "undefined" ||
        typeof YT.Player === "undefined"
    ) {
        return;
    }

    const playerElement =
        document.getElementById("youtubePlayer");

    if (!playerElement) {
        return;
    }

    createYouTubePlayer();
}


/* =========================================================
   HOST PEER
========================================================= */

function startHostPeer() {

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
                document.getElementById("roomCode");

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
                document.getElementById("remoteLink");

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

            remoteConnections.push(connection);

            const phoneStatus =
                document.getElementById("phoneStatus");

            if (phoneStatus) {
                phoneStatus.textContent =
                    "📱 Phone Connected";
            }

            connection.on(
                "open",
                function () {
                    sendState(connection);
                }
            );

            connection.on(
                "data",
                function (data) {
                    handleRemoteCommand(data);
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
                peer.connect(remoteRoom);

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
                    handleHostState(data);
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
   QR
========================================================= */

function generateQRCode(url) {

    const qr =
        document.getElementById("qrcode");

    if (!qr) {
        return;
    }

    qr.innerHTML = "";

    if (typeof QRCode !== "undefined") {

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
   COPY LINK
========================================================= */

function copyRemoteLink() {

    const element =
        document.getElementById("remoteLink");

    if (!element) {
        return;
    }

    const link = element.textContent;

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
                alert("📱 Remote link copied!");
            }
        )
        .catch(
            function () {
                alert("❌ Unable to copy link.");
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

        currentSong: currentSong,

        reservedSongs:
            [...reservedSongs],

        isPlaying:
            isPlaying

    });
}


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
   REMOTE COMMAND
========================================================= */

function handleRemoteCommand(data) {

    if (!data) {
        return;
    }

    switch (data.type) {

        case "reserve":
            reserveSong(data.index);
            break;

        case "removeReserve":
            removeReserve(data.index);
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
            loadSong(data.index, true);
            break;
    }
}


/* =========================================================
   HOST STATE → PHONE
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
        Boolean(data.isPlaying);

    const title =
        document.getElementById(
            "remoteSongTitle"
        );

    const artist =
        document.getElementById(
            "remoteArtist"
        );

    if (currentSong !== null && songs[currentSong]) {

        title.textContent =
            songs[currentSong].title;

        artist.textContent =
            songs[currentSong].artist;

    } else {

        title.textContent =
            "No Song Playing";

        artist.textContent =
            "Reserve a song below";

    }

    renderRemoteSongs();

    renderRemoteQueue();
}


/* =========================================================
   REMOTE SEND COMMAND
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

function loadSong(
    index,
    autoPlay = false
) {

    if (
        index === null ||
        index === undefined ||
        !songs[index]
    ) {
        return;
    }

    currentSong = index;

    const song =
        songs[currentSong];

    const title =
        document.getElementById("songTitle");

    const artist =
        document.getElementById("artist");

    if (title) {
        title.textContent =
            song.title;
    }

    if (artist) {
        artist.textContent =
            song.artist;
    }

    renderSongs();

    /*
       If player is not ready,
       remember the song.
    */

    if (!youtubePlayer) {

        pendingSongIndex =
            index;

        isPlaying = false;

        broadcastState();

        return;
    }

    youtubePlayer.loadVideoById(
        song.youtube
    );

    isPlaying = false;

    broadcastState();

    /*
       Auto play is used when:
       - first reserved song is selected
       - queue moves to next song
    */

    if (autoPlay) {

        setTimeout(
            function () {

                if (youtubePlayer) {
                    youtubePlayer.playVideo();
                }

            },
            500
        );
    }
}


/* =========================================================
   YOUTUBE READY
========================================================= */

function onYouTubePlayerReady(event) {

    console.log(
        "YouTube player ready."
    );

    let index =
        currentSong;

    if (
        pendingSongIndex !== null
    ) {

        index =
            pendingSongIndex;

        pendingSongIndex =
            null;

        currentSong =
            index;
    }

    if (
        index !== null &&
        songs[index]
    ) {

        event.target.loadVideoById(
            songs[index].youtube
        );

    }

    isPlaying = false;

    updateHostDisplay();

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

        renderSongs();
    }


    if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {

        isPlaying = false;

        broadcastState();

        renderSongs();
    }


    if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        isPlaying = false;

        /*
           Automatically play next reserved song.
        */

        setTimeout(
            function () {
                nextSong();
            },
            300
        );
    }
}


/* =========================================================
   CREATE YOUTUBE
========================================================= */

function createYouTubePlayer() {

    if (youtubePlayer) {
        return;
    }

    if (
        typeof YT === "undefined" ||
        typeof YT.Player === "undefined"
    ) {
        return;
    }

    const element =
        document.getElementById(
            "youtubePlayer"
        );

    if (!element) {
        return;
    }

    youtubePlayer =
        new YT.Player(
            "youtubePlayer",
            {

                videoId:
                    currentSong !== null
                        ? songs[currentSong].youtube
                        : "",

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
   UPDATE DISPLAY
========================================================= */

function updateHostDisplay() {

    const title =
        document.getElementById("songTitle");

    const artist =
        document.getElementById("artist");

    if (
        currentSong !== null &&
        songs[currentSong]
    ) {

        title.textContent =
            songs[currentSong].title;

        artist.textContent =
            songs[currentSong].artist;

    } else {

        title.textContent =
            "No Song Playing";

        artist.textContent =
            "Reserve a song from the menu";

    }

    renderSongs();
}


/* =========================================================
   NEXT SONG
========================================================= */

function nextSong() {

    /*
       IMPORTANT:
       If there is a reserved song,
       play the FIRST item in the queue.
    */

    if (reservedSongs.length > 0) {

        const nextIndex =
            reservedSongs.shift();

        loadSong(
            nextIndex,
            true
        );

        renderSongs();

        renderRemoteQueue();

        broadcastState();

        return;
    }

    /*
       If there are NO reserved songs,
       don't randomly skip to another song.

       This prevents a song from playing
       when nobody reserved anything.
    */

    currentSong = null;

    isPlaying = false;

    updateHostDisplay();

    broadcastState();
}


/* =========================================================
   PREVIOUS
========================================================= */

function previousSong() {

    if (currentSong === null) {
        return;
    }

    let previous =
        currentSong - 1;

    if (previous < 0) {
        previous =
            songs.length - 1;
    }

    loadSong(
        previous,
        false
    );
}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

    /*
       IMPORTANT:
       No current song = do nothing.
    */

    if (
        currentSong === null
    ) {

        /*
           If there is a queue,
           start the first reserved song.
        */

        if (
            reservedSongs.length > 0
        ) {

            const first =
                reservedSongs.shift();

            loadSong(
                first,
                true
            );

            renderSongs();

            broadcastState();

        }

        return;
    }


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
   RESERVE SONG
========================================================= */

function reserveSong(index) {

    if (
        index === null ||
        index === undefined ||
        !songs[index]
    ) {
        return;
    }

    /*
       Do not reserve the song currently playing.
    */

    if (
        index === currentSong
    ) {
        return;
    }

    /*
       Do not reserve same song twice.
    */

    if (
        reservedSongs.includes(index)
    ) {
        return;
    }

    reservedSongs.push(index);

    /*
       IMPORTANT:
       If there is NO song currently playing,
       immediately take the first reservation
       and start playing it.
    */

    if (
        currentSong === null &&
        !isPlaying
    ) {

        const first =
            reservedSongs.shift();

        loadSong(
            first,
            true
        );

    }

    renderSongs();

    renderRemoteQueue();

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

    renderRemoteQueue();

    broadcastState();
}


/* =========================================================
   HOST SEARCH
========================================================= */

function searchSongs() {

    const input =
        document.getElementById("search");

    if (!input) {
        return;
    }

    renderSongs(
        input.value.toLowerCase()
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


            /*
               CURRENT
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
                        ${isPlaying
                            ? "▶ NOW PLAYING"
                            : "⏸ PAUSED"}

                    </span>
                `;

                button.onclick =
                    function () {
                        togglePlay();
                    };

            }


            /*
               RESERVED
            */

            else if (
                reservedSongs.includes(index)
            ) {

                const number =
                    reservedSongs.indexOf(index) + 1;

                button.classList.add(
                    "reserved"
                );

                button.innerHTML = `

                    🎵 ${song.title}

                    <span>
                        📌 RESERVED #${number}
                        • Click to remove
                    </span>
                `;

                button.onclick =
                    function () {
                        removeReserve(index);
                    };

            }


            /*
               AVAILABLE
            */

            else {

                button.innerHTML = `

                    🎵 ${song.title}

                    <span>
                        ${song.artist}
                        • Click to reserve
                    </span>
                `;

                button.onclick =
                    function () {
                        reserveSong(index);
                    };
            }

            list.appendChild(button);
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

    renderRemoteSongs(
        input.value.toLowerCase()
    );
}


/* =========================================================
   RENDER PHONE SONGS
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


            /*
               CURRENT
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
                        ${isPlaying
                            ? "▶ NOW PLAYING"
                            : "⏸ PAUSED"}
                    </span>
                `;

                button.onclick =
                    function () {
                        remoteCommand("toggle");
                    };

            }


            /*
               RESERVED
            */

            else if (
                reservedSongs.includes(index)
            ) {

                const number =
                    reservedSongs.indexOf(index) + 1;

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
                        remoteRemoveReserve(index);
                    };

            }


            /*
               AVAILABLE
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
                        remoteReserve(index);
                    };
            }

            list.appendChild(button);
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
                    onclick="remoteRemoveReserve(${index})">
                    ✕
                </button>
            `;

            queue.appendChild(item);
        }
    );
}


/* =========================================================
   YOUTUBE API CALLBACK
========================================================= */

window.onYouTubeIframeAPIReady =
    function () {

        console.log(
            "YouTube IFrame API ready."
        );

        youtubeApiReady = true;

        initializeYouTubePlayer();
    };