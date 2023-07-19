export class VideosView {
  localVideo;
  localVideoContainer;
  remoteVideo;
  remoteVideoContainer;
  muteBtns;
  constructor() {
    this.localVideo = document.querySelector("#local-video");
    this.remoteVideo = document.querySelector("#remote-video");
    this.localVideoContainer = this.localVideo.parentElement;
    this.remoteVideoContainer = this.remoteVideo.parentElement;
    this.muteBtns = document.querySelectorAll("button.mute");
  }
  setLocalVideo(stream) {
    this.localStream = stream;
    this.localVideo.srcObject = stream;
    this.localVideoContainer.style.display = "flex";
  }
  setRemoteVideo(stream) {
    this.remoteStream = stream;
    this.remoteVideo.srcObject = stream;
    this.remoteVideoContainer.style.display = "flex";
  }
}
