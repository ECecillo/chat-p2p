import createWSClient from "./create-websocket-client";

const socket = createWSClient('ws://localhost:3000');

export default socket;
