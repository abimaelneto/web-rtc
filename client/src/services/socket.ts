import { io, Socket } from "socket.io-client";
import { createPeerConnectionInput, CustomEvent } from "./socket.types";

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
  socket?: Socket;
  peerConnection?: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  caller?: boolean;

  on(event: Event, handler: Function) {
    this.socket.on(event, handler);
  }

  async createOfferOrAnswer(room: string, onMessage: Function) {
    if (!this.peerConnection || !this.socket) return;
    const operation = this.caller ? "offer" : "answer";

    this.caller
      ? this.createDataChannel(room)
      : (this.peerConnection.ondatachannel = this.handleDataChannel);

    try {
      const sessionDescription = await (this.caller
        ? this.peerConnection.createOffer()
        : this.peerConnection.createAnswer());
      this.peerConnection.setLocalDescription(sessionDescription);
      this.socket.emit(operation, {
        type: operation,
        sdp: sessionDescription,
        room,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async createPeerConnection({
    onAddStream,
    stream,
    event,
  }: createPeerConnectionInput) {
    this.peerConnection = new RTCPeerConnection(iceServers);
    this.peerConnection.onicecandidate = handleIceCandidate;
    this.peerConnection.ontrack = onAddStream;
    this.peerConnection.addTrack(stream.getTracks()[0], stream);
    this.peerConnection.addTrack(stream.getTracks()[1], stream);

    if (!this.caller) {
      this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(event)
      );
    }
    this.createOfferOrAnswer();
  }

  handleAnswer(event: Event) {
    this.peerConnection?.setRemoteDescription(new RTCSessionDescription(event));
  }
  handleIceCandidate(event: CustomEvent) {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: event.label,
      candidate: event.candidate,
    });
    this.peerConnection?.addIceCandidate(candidate);
  }
  createDataChannel(roomNumber: string) {
    this.dataChannel = this.peerConnection?.createDataChannel(
      roomNumber
    ) as RTCDataChannel;
    this.dataChannel.onopen = (e) => {
      console.log("Data Channel successfully opened");
    };
    this.dataChannel.onmessage = onMessage;
  }
  handleDataChannel(event: CustomEvent) {
    this.dataChannel = event.channel as RTCDataChannel;
    this.dataChannel.onopen = (e) => {
      console.log("Data Channel successfully opened");
    };
    this.dataChannel.onmessage = onMessage;
  }
}
