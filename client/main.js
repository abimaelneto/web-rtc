const selectRoomDiv = document.querySelector("#select-room");
const consultingRoomDiv = document.querySelector("#consulting-room");
const roomNumberInput = document.querySelector("#room-input");
const enterRoomBtn = document.querySelector("#enter-room");
const localVideo = document.querySelector("#local-video");
const remoteVideo = document.querySelector("#remote-video");

const muteBtns = document.querySelectorAll("button.mute");

const chat = document.querySelector("#chat");

const callNameTitle = document.querySelector("#call-name-title");
const callNameInput = document.querySelector("#call-name-input");
const setNameBtn = document.querySelector("#set-name");

const messages = [];

let roomNumber,
  localStream,
  remoteStream,
  rtcPeerConnection,
  isCaller,
  dataChannel;

const socket = io("https://web-rtc-server-9cim.onrender.com");

// const socket = io("http://localhost:3333");

const iceServers = {
  iceServer: [
    // { urls: "stun:stun.services.mozilla.com" },
    // { urls: "stun:stun.l.google.mozilla.com:19302" },
    {
      urls: "turn:localhost:3478",
      credential: "password",
      username: "username",
    },
    {
      urls: "turn:coturn-server-l452.onrender.com:3478",
      credential: "password",
      username: "username",
    },
  ],
};

const streamConstraints = {
  video: true,
  audio: true,
};

navigator.permissions
  .query({ name: "microphone" })
  .then((permissionObj) => {
    console.log(permissionObj.state);
  })
  .catch((error) => {
    console.log("Got error :", error);
  });

navigator.permissions
  .query({ name: "camera" })
  .then((permissionObj) => {
    console.log(permissionObj.state);
  })
  .catch((error) => {
    console.log("Got error :", error);
  });

enterRoomBtn.onclick = () => {
  if (!roomNumberInput.value) {
    alert("please type a room name");
    return;
  }
  roomNumber = roomNumberInput.value;
  socket.emit("create or join", roomNumber);

  selectRoomDiv.style.display = "none";
  consultingRoomDiv.style.display = "block";
};

setNameBtn.onclick = () => {
  if (!callNameInput.value) {
    alert("please type a call name");
    return;
  }
  if (!dataChannel) {
    console.log("data channel is not defined");
  }
  dataChannel.send(
    JSON.stringify({ type: "text", value: callNameInput.value })
  );
};

muteBtns.forEach(
  (btn) =>
    (btn.onclick = (e) => {
      const video = e.target.parentElement.querySelector("video");
      video.muted = !video.muted;

      if (video.muted) {
        btn.classList.add("muted");
      } else {
        btn.classList.remove("muted");
      }

      if (!dataChannel) return;
      dataChannel.send(JSON.stringify({ type: "mute", value: btn.name }));
    })
);

socket.on("created", async (room) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
    document.querySelector("#test").innerHTML = "oi" + stream;

    localStream = stream;
    localVideo.srcObject = stream;

    isCaller = true;
  } catch (err) {
    alert(err);
  }
});

socket.on("joined", async (room) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
    document.querySelector("#test").innerHTML = "oi" + stream;
    localStream = stream;
    localVideo.srcObject = stream;

    socket.emit("ready", roomNumber);
  } catch (err) {
    alert(err);
  }
});

socket.on("ready", async (event) => {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);

    dataChannel = rtcPeerConnection.createDataChannel(roomNumber);
    dataChannel.onopen = (e) => {
      console.log("Data Channel successfully opened");
    };
    dataChannel.onmessage = onMessage;
    try {
      const sessionDescription = await rtcPeerConnection.createOffer();
      rtcPeerConnection.setLocalDescription(sessionDescription);
      socket.emit("offer", {
        type: "offer",
        sdp: sessionDescription,
        room: roomNumber,
      });
    } catch (err) {
      console.error(err);
    }
  }
});

socket.on("offer", async (event) => {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    try {
      const sessionDescription = await rtcPeerConnection.createAnswer();
      rtcPeerConnection.setLocalDescription(sessionDescription);
      socket.emit("answer", {
        type: "answer",
        sdp: sessionDescription,
        room: roomNumber,
      });
    } catch (err) {
      console.error(err);
    }
    rtcPeerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      dataChannel.onopen = (e) => {
        console.log("Data Channel successfully opened");
      };
      dataChannel.onmessage = onMessage;
    };
  }
});

socket.on("answer", (event) => {
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on("candidate", (event) => {
  const candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  rtcPeerConnection.addIceCandidate(candidate);
});

function onAddStream(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
}

function onIceCandidate(event) {
  if (event.candidate) {
    socket.emit("candidate", {
      type: "candidate",
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber,
    });
  }
}
function updateMessages() {
  chat.innerHTML = messages.map((m) => `<p>${m}</p>`);
}

function onMessage(event) {
  const { type, value } = JSON.parse(event.data);
  if (type == "text") {
    messages.push(value);
    updateMessages();
  }
  if (type == "mute") {
    const btn = document.querySelector(`button[name=${value}]`);
    const videoElement = btn.parentElement.querySelector("video");
    videoElement.muted = !videoElement.muted;
    if (videoElement.muted) {
      btn.classList.add("muted");
    } else {
      btn.classList.remove("muted");
    }
  }
}
