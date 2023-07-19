const selectRoomDiv = document.querySelector("#select-room");
const consultingRoomDiv = document.querySelector("#consulting-room");
const roomNumberInput = document.querySelector("#room-input");
const enterRoomBtn = document.querySelector("#enter-room");
const localVideo = document.querySelector("#local-video");
const remoteVideo = document.querySelector("#remote-video");

const localVideoContainer = localVideo.parentElement;
const remoteVideoContainer = remoteVideo.parentElement;

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
      const value = btn.name == "local" ? "remote" : "local";
      dataChannel.send(JSON.stringify({ type: "mute", value }));
    })
);

socket.on("created", async (room) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);

    localStream = stream;
    localVideo.srcObject = stream;
    localVideoContainer.style.display = "flex";
    console.log(localVideo);
    isCaller = true;
  } catch (err) {
    alert(err);
  }
});

socket.on("joined", async (room) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
    localStream = stream;
    localVideo.srcObject = stream;
    localVideoContainer.style.display = "flex";
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
  remoteVideoContainer.style.display = "flex";
});

socket.on("candidate", (event) => {
  const candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  rtcPeerConnection.addIceCandidate(candidate);
});

socket.on("disconnect-user", () => {
  console.log("teste");
  remoteStream = null;
  remoteVideo.srcObject = null;
  remoteVideoContainer.style.display = "none";
});
function onAddStream(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
  remoteVideoContainer.style.display = "flex";
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

window.onbeforeunload = () => {
  socket.emit("disconnect-user", { room: roomNumber });
};
