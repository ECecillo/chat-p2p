import configuration from '@/webrtc/peer.config';
import socket from '@/websocket/client-ws';
import { useEffect, useRef, useState } from 'react';

function VideoRoom() {
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localStreamDescription, setLocalStreamDescription] = useState<RTCSessionDescriptionInit | null>(
    null,
  );
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream: MediaStream) => {
        if (localVideo.current) {
          setLocalStream(stream);
        }
      })
      .catch((error) => {
        console.error('Error accessing media devices. 🎥', error);
      });
  }, []);

  socket.on('newUser', ({ peerId, signal }: { peerId: string; signal: string }) => {
    const peerConnection = new RTCPeerConnection(configuration);
    console.log('Create a peer instance because a new user is now discoverable');

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

    // define our session description that hold metadata about our stream (ip, codec ...).
    peerConnection
      .createOffer()
      .then((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        setLocalStreamDescription(sessionDescription);

        const myPeerId = socket.id;
        console.log('Send Session Description offer to peer', sessionDescription, myPeerId, peerId);
        socket.emit('offer', { peerSession: sessionDescription, fromPeerId: myPeerId, toPeerId: peerId });
      })
      .catch((error) => {
        console.error('Error creating session description', error);
      });

    socket.on(
      'offer',
      ({
        remoteDescriptionOffer,
        fromPeerId,
        myPeerId,
      }: {
        remoteDescriptionOffer: RTCSessionDescriptionInit;
        fromPeerId: string;
        myPeerId: string;
      }) => {
        console.log('Looks like I am receiving an offer from a peer:', fromPeerId);
        const remoteDescription = new RTCSessionDescription(remoteDescriptionOffer);

        peerConnection.setRemoteDescription(remoteDescription).then(async () => {
          const answer = await peerConnection.createAnswer();
          peerConnection.setLocalDescription(answer);

          const toPeerId = fromPeerId;
          socket.emit('answer', localStreamDescription, myPeerId, toPeerId);
        });
      },
    );

    socket.on(
      'answer',
      (incomingRemotePeerSesssion: RTCSessionDescriptionInit, fromPeerId: string, toPeerId: string) => {
        console.log('Looks like I am receiving an answer from a peer:', fromPeerId);
        peerConnection.setRemoteDescription(incomingRemotePeerSesssion);
      },
    );

    // Si un des peers nous envoie cette info, alors on doit faire en sorte que
    // Notre instance peerConnections ajoute ce nouveau ICE pour nous.
    socket.on('iceCandidate', async (candidate) => {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding received ice candidate', error);
      }
    });
  });

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
