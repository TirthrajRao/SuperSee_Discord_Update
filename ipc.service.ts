// ipc.service.ts
import { Injectable } from "@angular/core";
import { ipcRenderer } from "electron";

@Injectable({
  providedIn: "root",
})
export class IpcService {
  constructor() {}

  sendMessageToMainProcess(eventName: string, data: any) {
    ipcRenderer.send(eventName, data);
  }

  onMessageFromMainProcess(
    eventName: string,
    callback: (event: any, data: any) => void
  ) {
    ipcRenderer.on(eventName, callback);
  }

  removeListener(eventName: string, callback: (event: any, data: any) => void) {
    ipcRenderer.removeListener(eventName, callback);
  }
}
