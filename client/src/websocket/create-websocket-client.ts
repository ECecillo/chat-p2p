import { io } from "socket.io-client";

const createWSClient = (url: string) => {
  const ws = io(url);
  return ws;
};

export default createWSClient;
