import React from 'react';

interface VideoCallProps {
  stream: MediaStream | null;
  userVideo: React.RefObject<HTMLVideoElement>;
  partnerVideo: React.RefObject<HTMLVideoElement>;
  callAccepted: boolean;
  receivingCall: boolean;
  callerName: string;
  isCalling: boolean;
  acceptCall: () => void;
  onReject: () => void;
  onEnd: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({
  stream,
  userVideo,
  partnerVideo,
  callAccepted,
  receivingCall,
  callerName,
  isCalling,
  acceptCall,
  onReject,
  onEnd
}) => {
  // Attacher le stream à la vidéo locale
  React.useEffect(() => {
    if (stream && userVideo.current) {
      userVideo.current.srcObject = stream;
    }
  }, [stream]);

  if (!callAccepted && !receivingCall && !isCalling) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex gap-4">
        {/* Vidéo locale */}
        <div className="relative flex-1 min-h-0">
          <video
            ref={userVideo}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover bg-black border-2 border-red-800"
          />
          <div className="absolute bottom-2 left-2 text-red-500 font-bold bg-black/50 px-2 py-1 uppercase">
            Vous
          </div>
        </div>

        {/* Vidéo distante */}
        {callAccepted && (
          <div className="relative flex-1 min-h-0">
            <video
              ref={partnerVideo}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-black border-2 border-red-800"
            />
            <div className="absolute bottom-2 left-2 text-red-500 font-bold bg-black/50 px-2 py-1 uppercase">
              {callerName}
            </div>
          </div>
        )}
      </div>

      {/* Contrôles d'appel */}
      <div className="mt-4 flex justify-center items-center space-x-4">
        {receivingCall && !callAccepted && (
          <div className="flex items-center space-x-4">
            <span className="text-red-400 uppercase">
              Appel de {callerName}
            </span>
            <button
              onClick={acceptCall}
              className="px-4 py-2 bg-red-800 hover:bg-red-900 text-red-100 border-2 border-red-600 uppercase"
            >
              Répondre
            </button>
            <button
              onClick={onReject}
              className="px-4 py-2 bg-black hover:bg-red-900/20 text-red-600 border-2 border-red-800 uppercase"
            >
              Rejeter
            </button>
          </div>
        )}

        {(callAccepted || isCalling) && (
          <button
            onClick={onEnd}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 border-2 border-red-600 uppercase"
          >
            Terminer l'appel
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;