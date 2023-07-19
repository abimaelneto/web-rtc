const streamConstraints = {
  video: true,
  audio: true,
};

export class CameraService {
  stream;
  constructor() {
    this.getVideo();
  }
  async getVideo() {
    this.stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
    return;
  }
}
