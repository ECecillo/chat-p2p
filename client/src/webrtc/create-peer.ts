import { Socket } from "socket.io-client";
import { PeerConfiguration } from "./peer.config";

const createPeer = (socket: Socket, {config} : {config: PeerConfiguration}) => {
  const peerInstance = new RTCPeerConnection(config);

  peerInstance.onicecandidate = (event) => {
    if(event.candidate) {
      console.log('Sending ICE candidate to peer:', event.candidate);
      socket.emit('iceCandidate', event.candidate, roomId);
    }
  }

}


export default createPeer;
