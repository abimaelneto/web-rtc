import { Controller } from "../controllers/index.js";
import { CameraService } from "../services/camera.js";
import { SocketService } from "../services/socket.js";
import { RoomsView } from "../views/rooms.ts/index.js";
import { VideosView } from "../views/videos.js";

export class Factory {
  static init() {
    return new Controller({
      roomsView: new RoomsView(),
      videosView: new VideosView(),
      socketService: new SocketService(),
      cameraService: new CameraService(),
    });
  }
}
