export class Controller {
  roomsView;
  videosView;
  socketService;
  socket;
  roomNumber;
  isCaller;
  cameraService;
  constructor({ roomsView, videosView, socketService, cameraService }) {
    this.roomsView = roomsView;
    this.videosView = videosView;
    this.cameraService = cameraService;
    this.socketService = socketService;
    this.init();
  }
  init() {
    this.socketService.socket = io("https://web-rtc-server-9cim.onrender.com");
    this.socketService.on("created", this.onCreated);
    this.socketService.on("joined", this.onJoined);
    this.socketService.on("ready", this.onReady);
    this.socketService.on("offer", this.onOffer);
    this.socketService.on("answer", this.onAnswer);
    this.socketService.on("candidate", this.onCandidate);
    this.socketService.on("disconnect-user", this.onDisconnect);
  }
  async handlePromise(promise) {
    try {
      promise();
    } catch (err) {
      alert(err);
    }
  }
  async onCreated() {
    this.handlePromise(async () => {
      const video = await this.cameraService.getVideo();
      this.videosView.setLocalVideo(video);
      this.isCaller = true;
    });
  }

  async onJoined(room) {
    this.handlePromise(async () => {
      const video = await this.cameraService.getVideo();
      this.videosView.setLocalVideo(video);
      this.socket.emit("ready", this.roomNumber);
    });
  }
  async onReady() {
    if (!isCaller) return;
    this.socketService.createPeerConnection({
      onAddStream: this.onAddStream,
      onMessage: this.onMessage,
      roomNumber: this.roomNumber,
    });
  }

  async onOffer(event) {
    if (!isCaller) return;
    this.socketService.createPeerConnection({
      onAddStream: this.onAddStream,
      onMessage: this.onMessage,
      roomNumber: this.roomNumber,
      event,
      stream: this.videosView.localStream,
    });
  }
  async onAnswer(event) {
    this.socketService.handleAnswer(event);
    remoteVideoContainer.style.display = "flex";
  }
  async onIceCandidate(event) {
    this.socketService.handleIceCandidate();
  }
  async onDisconnect(event) {
    remoteStream = null;
    remoteVideo.srcObject = null;
    remoteVideoContainer.style.display = "none";
  }
  onAddStream(event) {
    this.videosView.setRemoteVideo(event.streams[0]);
  }
  onMessage(event) {
    // const { type, value } = JSON.parse(event.data);
    // if (type == "text") {
    //   messages.push(value);
    //   updateMessages();
    // }
    // if (type == "mute") {
    //   const btn = document.querySelector(`button[name=${value}]`);
    //   const videoElement = btn.parentElement.querySelector("video");
    //   videoElement.muted = !videoElement.muted;
    //   if (videoElement.muted) {
    //     btn.classList.add("muted");
    //   } else {
    //     btn.classList.remove("muted");
    //   }
    // }
  }
  onEnterRoom() {
    this.roomsView.enterRoom();

    if (!this.roomNumberInput.value) {
      alert("please type a room name");
      return;
    }
    roomNumber = this.roomNumberInput.value;
    socket.emit("create or join", roomNumber);
  }
}
