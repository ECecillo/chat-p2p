import configuration from '@/webrtc/peer.config';
import socket from '@/websocket/client-ws';
import { useEffect, useRef, useState } from 'react';

function VideoRoom() {
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);

  const [roomId, setRoomId] = useState<string>('1');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localStreamDescription, setLocalStreamDescription] = useState<RTCSessionDescriptionInit | null>(
    null,
  );
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>(
    new RTCPeerConnection(configuration),
  );

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((localStream: MediaStream) => {
        if (localVideo.current) {
          localVideo.current!.srcObject = localStream;
          setLocalStream(localStream);
        }
      })
      .catch((error) => {
        console.error('Error accessing media devices. 🎥', error);
      });
  }, []);

  useEffect(() => {
    socket.emit('joinRoom', roomId);
  }, [roomId]);

  useEffect(() => {
    if (localStream) {
      // For each track that our webcam record, transmit to our peer instance
      // Will then be send to the second or more users.
      for (const track of localStream.getTracks()) {
        console.log('Local stream will now send stuff using peer instance');
        peerConnection.addTrack(track, localStream);
      }
    }

    peerConnection.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    // Permet aux peers de savoir sur quelle ICE candidate ils peuvent se brancher
    // Si jamais on switch sur un autre.
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', event.candidate); // , roomId
      }
    };

    socket.on('offer', async (offer) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('answer', answer, roomId);
    });

    socket.on('answer', async (answer) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Si un des peers nous envoie cette info, alors on doit faire en sorte que
    // Notre instance peerConnections ajoute ce nouveau ICE pour nous.
    socket.on('iceCandidate', async (candidate) => {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding received ice candidate', error);
      }
    });
  }, [roomId]);

  return (
    <div>
      <h1>Video Room</h1>
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
          <h2>Local Video</h2>
          <video
            ref={localVideo}
            id="localVideo"
            autoPlay
            playsInline
            muted
            style={{ background: 'black' }}
          ></video>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
          <h2>Remote video</h2>
          <video
            ref={remoteVideo}
            id="remoteVideo"
            autoPlay
            playsInline
            style={{ background: 'black' }}
          ></video>
        </div>
      </div>
    </div>
  );
}
export default VideoRoom;
