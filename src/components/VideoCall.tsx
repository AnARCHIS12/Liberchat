import React from 'react';
import { Socket } from 'socket.io-client';

interface VideoCallProps {
  socket: Socket;
  username: string;
  callingUser: string;
  onClose: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({
  socket,
  username,
  callingUser,
  onClose
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex gap-4">
        {/* Vidéo locale */}
        <div className="relative flex-1 min-h-0">
          <video
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
        <div className="relative flex-1 min-h-0">
          <video
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-black border-2 border-red-800"
          />
          <div className="absolute bottom-2 left-2 text-red-500 font-bold bg-black/50 px-2 py-1 uppercase">
            {callingUser}
          </div>
        </div>
      </div>

      {/* Contrôles d'appel */}
      <div className="mt-4 flex justify-center items-center space-x-4">
        <div className="flex items-center space-x-4">
          <span className="text-red-400 uppercase">
            Appel de {callingUser}
          </span>
          <button
            onClick={() => {}}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-red-100 border-2 border-red-600 uppercase"
          >
            Répondre
          </button>
          <button
            onClick={() => {}}
            className="px-4 py-2 bg-black hover:bg-red-900/20 text-red-600 border-2 border-red-800 uppercase"
          >
            Rejeter
          </button>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 border-2 border-red-600 uppercase"
        >
          Terminer l'appel
        </button>
      </div>
    </div>
  );
};

export default VideoCall;