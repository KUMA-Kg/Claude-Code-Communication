import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Maximize2,
  Minimize2,
  Users as UsersIcon
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

interface VideoChatProps {
  roomId: string;
  users: User[];
  onClose: () => void;
}

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export const VideoChat: React.FC<VideoChatProps> = ({ roomId, users, onClose }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeLocalStream();
    return () => {
      cleanup();
    };
  }, []);

  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsConnected(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('カメラまたはマイクへのアクセスが拒否されました');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const cleanup = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connections
    peerConnections.forEach(peer => {
      peer.connection.close();
    });
  };

  const handleEndCall = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Video className="h-5 w-5" />
          ビデオ通話
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 bg-gray-900">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-sm">
              自分
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="h-12 w-12 text-gray-500" />
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {users.filter(u => u.id !== 'current-user').map(user => (
            <div key={user.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-medium"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="absolute bottom-4 left-4 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-sm">
                {user.name}
              </div>
              {activespeaker === user.id && (
                <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-100 border-t">
        <div className="flex items-center justify-center space-x-4">
          <Button
            size="lg"
            variant={isAudioEnabled ? 'outline' : 'destructive'}
            onClick={toggleAudio}
            className="rounded-full p-4"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            size="lg"
            variant={isVideoEnabled ? 'outline' : 'destructive'}
            onClick={toggleVideo}
            className="rounded-full p-4"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
            className="rounded-full px-6"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            通話を終了
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-full p-4"
          >
            <UsersIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};