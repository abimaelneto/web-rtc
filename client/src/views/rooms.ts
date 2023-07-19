export class RoomsView {
  selectRoomDiv: HTMLDivElement;
  consultingRoomDiv: HTMLDivElement;
  roomNumberInput: HTMLInputElement;
  enterRoomBtn: HTMLButtonElement;
  callNameTitle;
  callNameInput;
  roomNumber?: string;
  setNameBtn: HTMLButtonElement;

  constructor() {
    console.log(document);
    this.selectRoomDiv = document.querySelector(
      "#select-room"
    ) as HTMLDivElement;
    this.consultingRoomDiv = document.querySelector(
      "#consulting-room"
    ) as HTMLDivElement;
    this.roomNumberInput = document.querySelector(
      "#room-input"
    ) as HTMLInputElement;
    this.enterRoomBtn = document.querySelector(
      "#enter-room"
    ) as HTMLButtonElement;
    this.callNameTitle = document.querySelector("#call-name-title");
    this.callNameInput = document.querySelector("#call-name-input");
    this.setNameBtn = document.querySelector("#set-name") as HTMLButtonElement;

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
    this.roomNumber = this.roomNumberInput.value;
    // socket.emit("create or join", roomNumber);
  }
}
