export interface createPeerConnectionInput {
  onAddStream: (this: RTCPeerConnection, ev: RTCTrackEvent) => any;
  stream: MediaProvider;
  event: Event;
}

export interface CustomEvent {
  label: number;
  candidate: string;
  channel?: RTCDataChannel;
}
