export class VideosView {
  localVideo: HTMLVideoElement;
  localVideoContainer: HTMLDivElement;
  remoteVideo: HTMLVideoElement;
  remoteVideoContainer: HTMLDivElement;
  muteBtns;
  localStream?: MediaProvider;
  remoteStream?: MediaProvider;
  constructor() {
    this.localVideo = document.querySelector(
      "#local-video"
    ) as HTMLVideoElement;
    this.remoteVideo = document.querySelector(
      "#remote-video"
    ) as HTMLVideoElement;
    this.localVideoContainer = this.localVideo.parentElement as HTMLDivElement;
    this.remoteVideoContainer = this.remoteVideo
      .parentElement as HTMLDivElement;
    this.muteBtns = document.querySelectorAll("button.mute");
  }
  setLocalVideo(stream: MediaProvider) {
    this.localStream = stream;
    this.localVideo.srcObject = stream;
    this.localVideoContainer.style.display = "flex";
  }
  setRemoteVideo(stream: MediaProvider) {
    this.remoteStream = stream;
    this.remoteVideo.srcObject = stream;
    this.remoteVideoContainer.style.display = "flex";
  }
}
