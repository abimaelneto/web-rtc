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

export class SocketService {
  socket;
  peerConnection;
  dataChannel;
  caller;

  on(event, handler) {
    this.socket.on(event, handler);
  }

  async createOfferOrAnswer() {
    const operation = this.caller ? "offer" : "answer";

    this.caller
      ? this.createDataChannel()
      : (this.peerConnection.ondatachannel = this.handleDataChannel);

    try {
      const sessionDescription = await (this.caller
        ? this.peerConnection.createOffer()
        : this.peerConnection.createAnswer());
      this.peerConnection.setLocalDescription(sessionDescription);
      this.socket.emit(operation, {
        type: operation,
        sdp: sessionDescription,
        room: roomNumber,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async createPeerConnection({ onAddStream, stream, event }) {
    this.peerConnection = new RTCPeerConnection(iceServers);
    this.peerConnection.onicecandidate = handleIceCandidate;
    this.peerConnection.ontrack = onAddStream;
    this.peerConnection.addTrack(stream.getTracks()[0], stream);
    this.peerConnection.addTrack(stream.getTracks()[1], stream);

    if (!caller) {
      this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(event)
      );
    }
    this.createOfferOrAnswer();
  }

  handleAnswer(event) {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(event));
  }
  handleIceCandidate(event) {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: event.label,
      candidate: event.candidate,
    });
    this.peerConnection.addIceCandidate(candidate);
  }
  createDataChannel() {
    this.dataChannel = this.peerConnection.createDataChannel(roomNumber);
    this.dataChannel.onopen = (e) => {
      console.log("Data Channel successfully opened");
    };
    this.dataChannel.onmessage = onMessage;
  }
  handleDataChannel(event) {
    this.dataChannel = event.channel;
    this.dataChannel.onopen = (e) => {
      console.log("Data Channel successfully opened");
    };
    this.dataChannel.onmessage = onMessage;
  }
}
