export class RoomsView {
  selectRoomDiv;
  consultingRoomDiv;
  roomNumberInput;
  enterRoomBtn;
  callNameTitle;
  callNameInput;
  setNameBtn;

  constructor() {
    this.selectRoomDiv = document.querySelector("#select-room");
    this.consultingRoomDiv = document.querySelector("#consulting-room");
    this.roomNumberInput = document.querySelector("#room-input");
    this.enterRoomBtn = document.querySelector("#enter-room");
    this.callNameTitle = document.querySelector("#call-name-title");
    this.callNameInput = document.querySelector("#call-name-input");
    this.setNameBtn = document.querySelector("#set-name");

    this.enterRoomBtn.onclick = this.onEnterRoom;
  }
  enterRoom() {
    this.selectRoomDiv.style.display = "none";
    this.consultingRoomDiv.style.display = "block";
  }
  onEnterRoom() {
    console.log("enter");
    if (!this.roomNumberInput.value) {
      alert("please type a room name");
      return;
    }
    roomNumber = this.roomNumberInput.value;
    socket.emit("create or join", roomNumber);
  }
}
