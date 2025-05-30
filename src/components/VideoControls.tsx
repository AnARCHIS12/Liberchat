import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface VideoControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  showVideoToggle?: boolean;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  showVideoToggle = true,
}) => {
  return (
    <div className="p-4 bg-gray-800 flex justify-center space-x-4">
      <button
        onClick={onToggleMute}
        className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} hover:opacity-90 transition-opacity`}
        title={isMuted ? 'Activer le micro' : 'Couper le micro'}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      {showVideoToggle && (
        <button
          onClick={onToggleVideo}
          className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} hover:opacity-90 transition-opacity`}
          title={isVideoOff ? 'Activer la caméra' : 'Couper la caméra'}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
      )}

      <button
        onClick={onEndCall}
        className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        title="Terminer l'appel"
      >
        <PhoneOff className="w-6 h-6" />
      </button>
    </div>
  );
};