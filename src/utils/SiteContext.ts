import { createContext, useContext } from "react";
import { AccountData } from "./account";
import { Socket } from "socket.io-client";
import { Notification } from "@/utils/notifications";

export class SiteContextType {
  loggedInAs?: AccountData;
  setLoggedInAs?: (loggedInAs: AccountData | undefined) => void;
  socket?: Socket;
  setLoading: (loaded: boolean) => void;
  notify: (notification: Notification) => void = () => {};
  playAudio: (src: string) => Promise<void> = () => Promise.resolve();
  setVolume: (volume: number) => void = () => {};
  copyToClipboard: (text: string) => void = () => {};
  volume: number;
  socketCallback(
    event: string,
    callback: (...args: any[]) => void,
    data?: any,
  ) {
    const id = Math.random().toString();
    this.socket!.once(id, callback);
    const sendData = {
      callbackId: id,
      type: event,
      ...data,
    };
    this.socket!.emit("message", sendData);
  }

  socketMessage(event: string, data?: any) {
    this.socket!.emit("message", {
      type: event,
      ...data,
    });
  }

  constructor(
    loggedInAs?: AccountData | undefined,
    setLoggedInAs?: (loggedInAs: AccountData | undefined) => void,
    socket?: Socket | undefined,
    setLoading?: (loaded: boolean) => void,
    playAudio?: (src: string) => Promise<void>,
    volume?: number,
    setVolume?: (volume: number) => void,
    notify?: (notification: Notification) => void,
    copyToClipboard?: (text: string) => void,
  ) {
    this.loggedInAs = loggedInAs;
    this.setLoggedInAs = setLoggedInAs;
    this.socket = socket;
    this.setLoading = setLoading!;
    this.playAudio = playAudio!;
    this.volume = volume!;
    this.notify = notify!;
    this.setVolume = setVolume!;
    this.copyToClipboard = copyToClipboard!;
  }
}

const SiteContext = createContext<SiteContextType>(new SiteContextType());

export const useSite = () => useContext(SiteContext);

export default SiteContext;
