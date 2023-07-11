const selectRoomDiv = document.querySelector("#select-room");
const consultingRoomDiv = document.querySelector("#consulting-room");
const roomNumberInput = document.querySelector("#room-input");
const enterRoomBtn = document.querySelector("#enter-room");
const localVideo = document.querySelector("#local-video");
const remoteVideo = document.querySelector("#remote-video");

const callNameTitle = document.querySelector("#call-name-title");
const callNameInput = document.querySelector("#call-name-input");
const setNameBtn = document.querySelector("#set-name");

let roomNumber,
  localStream,
  remoteStream,
  rtcPeerConnection,
  isCaller,
  dataChannel;

const socket = io("http://localhost:3333");

const iceServers = {
  iceServer: [
    // { urls: "stun:stun.services.mozilla.com" },
    // { urls: "stun:stun.l.google.mozilla.com:19302" },
    {
      urls: "https://coturn-server-l452.onrender.com:3478",
      credential: "password",
      username: "username",
    },
  ],
};

const streamConstraints = {
  video: true,
  audio: true,
};

enterRoomBtn.onclick = async () => {
  if (!roomNumberInput.value) {
    alert("please type a room name");
    return;
  }
  roomNumber = roomNumberInput.value;
  socket.emit("create or join", roomNumber);

  selectRoomDiv.style.display = "none";
  consultingRoomDiv.style.display = "block";
};

setNameBtn.onclick = async () => {
  if (!callNameInput.value) {
    alert("please type a call name");
    return;
  }
  dataChannel.send(callNameInput.value);
  callNameTitle.innerText = callNameInput.value;
};

socket.on("created", async (room) => {
  console.log("created");
  try {
    const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);

    localStream = stream;
    localVideo.srcObject = stream;

    isCaller = true;
  } catch (err) {
    console.error(err);
  }
});

socket.on("joined", async (room) => {
  console.log("join");
  try {
    const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);

    localStream = stream;
    localVideo.srcObject = stream;

    socket.emit("ready", roomNumber);
  } catch (err) {
    console.error(err);
  }
});

socket.on("ready", async (event) => {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
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
    dataChannel = rtcPeerConnection.createDataChannel(roomNumber);
    dataChannel.onmessage = (event) => {
      callNameTitle.innerText = event.data;
    };
    console.log(dataChannel);
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
      dataChannel.onmessage = (event) => {
        callNameTitle.innerText = event.data;
      };
      console.log(dataChannel);
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
  console.log(remoteVideo);
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log("sending ice candidate", event.candidate);
    socket.emit("candidate", {
      type: "candidate",
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber,
    });
  }
}
