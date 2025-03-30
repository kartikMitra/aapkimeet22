let client = AgoraRTC.createClient({ mode: 'rtc', codec: "vp8" });

let config = {
    appid: "dd5787a81f0046c0bf563267d8bfd3f7", 
    token: "007eJxTYKh+wqT7MuRO2MMT1tMVHXd9XM5gEHbS4y1P2brDx605HBwVGFJSTM0tzBMtDNMMDEzMkg2S0kzNjI3MzFMsktJSjNPM/bpfpjcEMjJEb9JmZGSAQBCfkyGxoCA7Mzc1tYSBAQDbySEP",
    uid: null,
    channel: "appkimeet", // ✅ Replace with your channel name
};

// Store local tracks (audio & video)
let localTracks = {
    audioTrack: null,
    videoTrack: null
};

// Track mute states
let localTrackState = {
    audioTrackMuted: false,
    videoTrackMuted: false,
};

// Store remote users
let remoteTracks = {};

// 🚀 Join button event
document.getElementById('join-btn').addEventListener('click', async () => {
    config.uid = document.getElementById('username').value || `User-${Math.floor(Math.random() * 1000)}`;
    
    await joinStreams();
    
    document.getElementById('join-wrapper').style.display = 'none';
    document.getElementById('footer').style.display = 'flex';
});

// 🚀 Mute/Unmute Mic
document.getElementById('mic-btn').addEventListener('click', async () => {
    if (localTracks.audioTrack) {
        localTrackState.audioTrackMuted = !localTrackState.audioTrackMuted;
        await localTracks.audioTrack.setMuted(localTrackState.audioTrackMuted);
        document.getElementById('mic-btn').style.backgroundColor = localTrackState.audioTrackMuted ? 'rgb(255, 80, 80, 0.7)' : '#1f1f1f8e';
    }
});

// 🚀 Mute/Unmute Camera
document.getElementById('camera-btn').addEventListener('click', async () => {
    if (localTracks.videoTrack) {
        localTrackState.videoTrackMuted = !localTrackState.videoTrackMuted;
        await localTracks.videoTrack.setMuted(localTrackState.videoTrackMuted);
        document.getElementById('camera-btn').style.backgroundColor = localTrackState.videoTrackMuted ? 'rgb(255, 80, 80, 0.7)' : '#1f1f1f8e';
    }
});

// 🚀 Leave Button
document.getElementById('leave-btn').addEventListener('click', async () => {
    for (let trackName in localTracks) {
        let track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            localTracks[trackName] = null;
        }
    }

    await client.leave();
    
    document.getElementById('footer').style.display = 'none';
    document.getElementById('user-streams').innerHTML = '';
    document.getElementById('join-wrapper').style.display = 'block';
});

// 🚀 Join Stream Function
let joinStreams = async () => {
    try {
        // Handle remote users
        client.on("user-published", handleUserJoined);
        client.on("user-left", handleUserLeft);

        // Volume indicator
        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", function(evt) {
            evt.forEach((speaker) => {
                let volumeIcon = document.getElementById(`volume-${speaker.uid}`);
                if (volumeIcon) {
                    volumeIcon.src = speaker.level > 0 ? './assets/volume-on.svg' : './assets/volume-off.svg';
                }
            });
        });

        // ✅ Join the Agora channel and get local tracks
        [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
            client.join(config.appid, config.channel, config.token || null, config.uid || null),
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack()
        ]);

        // ✅ Create user video container
        let player = `
            <div class="video-containers" id="video-wrapper-${config.uid}">
                <p class="user-uid"><img class="volume-icon" id="volume-${config.uid}" src="./assets/volume-on.svg" /> ${config.uid}</p>
                <div class="video-player player" id="stream-${config.uid}"></div>
            </div>`;

        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
        
        // ✅ Play local video
        localTracks.videoTrack.play(`stream-${config.uid}`);

        // ✅ Publish video and audio
        await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
    } catch (error) {
        console.error("Error joining stream:", error);
    }
};

// 🚀 Handle Remote User Joining
let handleUserJoined = async (user, mediaType) => {
    console.log('User joined:', user.uid);

    remoteTracks[user.uid] = user;
    
    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video' && user.videoTrack) {
        let player = document.getElementById(`video-wrapper-${user.uid}`);
        if (player) player.remove();

        player = `
            <div class="video-containers" id="video-wrapper-${user.uid}">
                <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                <div class="video-player player" id="stream-${user.uid}"></div>
            </div>`;

        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`stream-${user.uid}`);
    }

    if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
    }
};

// 🚀 Handle User Leaving
let handleUserLeft = (user) => {
    console.log('User left:', user.uid);
    delete remoteTracks[user.uid];
    
    let userContainer = document.getElementById(`video-wrapper-${user.uid}`);
    if (userContainer) {
        userContainer.remove();
    }
};
