import { useState } from 'react';

interface UserListProps {
  users: Array<{ username: string; socketId: string }>;
  currentUser: string;
  isMobile?: boolean;
  inChatInput?: boolean;
  onCallUser?: (userToCall: string) => void; // Ajout pour compatibilité App
}

export const UserList = ({ users, currentUser, isMobile = false, inChatInput = false }: UserListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const otherUsers = users.filter(user => user.username !== currentUser);
  const userCount = otherUsers.length;

  if (isMobile) {
    return (
      <div className={inChatInput ? "" : "fixed bottom-[4.5rem] right-3 z-50"}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-black text-white rounded-lg w-10 h-10 shadow-lg border-2 border-white hover:bg-red-700/20 flex items-center justify-center relative"
        >
          <span className="absolute -top-2 -right-2 bg-red-700 text-[10px] min-w-[18px] h-[18px] px-1 rounded-full border border-white flex items-center justify-center">
            {userCount}
          </span>
          <span className="text-sm">👥</span>
        </button>
        
        {isExpanded && (
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/95 backdrop-blur-sm border-2 border-red-700 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 bg-red-700/20 border-b border-red-700">
              <h3 className="text-sm font-bold text-white font-mono">Camarades présent·e·s</h3>
            </div>
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-red-700 scrollbar-track-black">
              {users.map(user => (
                <div 
                  key={user.socketId} 
                  className={`p-2 text-sm flex items-center gap-2 ${
                    user.username === currentUser
                      ? "bg-gradient-to-r from-red-900/40 to-black/95 font-bold"
                      : "hover:bg-red-700/20"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    user.username === currentUser
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`} />
                  <span className="text-white font-mono">{user.username}</span>
                  {user.username === currentUser && (
                    <span className="text-xs text-red-400 ml-1">(Vous)</span>
                  )}
                </div>
              ))}
              {users.length <= 1 && (
                <p className="p-2 text-sm text-gray-400 italic font-mono">En attente d'autres camarades...</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Version desktop
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">
        <span className="text-red-600">Camarades présent·e·s</span>
        <div className="h-0.5 w-full bg-gradient-to-r from-red-700 via-red-600 to-transparent mt-2"></div>
      </h2>
      <div className="space-y-2">
        {users.map(user => (
          <div 
            key={user.socketId}
            className={`relative flex items-center gap-2 p-2 border rounded-lg transition-all duration-200 overflow-hidden ${
              user.username === currentUser 
                ? "bg-gradient-to-r from-red-900/40 to-black/95 border-red-500" 
                : "bg-gradient-to-r from-black to-black/95 border-red-700"
            } hover:bg-gradient-to-r hover:from-red-950 hover:to-black`}
          >
            <div className="absolute top-0 right-0 w-8 h-8 opacity-5">
              <img 
                src="/images/liberchat-logo.svg" 
                alt="" 
                className="w-full h-full"
              />
            </div>
            <div className={`w-2 h-2 rounded-full animate-pulse shadow-md ${
              user.username === currentUser 
                ? "bg-red-500 shadow-red-500/30" 
                : "bg-green-500 shadow-green-500/30"
            }`}></div>
            <span className={`text-white relative z-10 ${
              user.username === currentUser ? "font-bold" : ""
            }`}>{user.username}</span>
            {user.username === currentUser && (
              <span className="text-xs text-red-400 ml-2">(Vous)</span>
            )}
          </div>
        ))}
        {users.length <= 1 && (
          <div className="relative text-center p-3 border border-red-700/50 rounded-lg bg-gradient-to-r from-black/30 to-red-950/10 overflow-hidden">
            <div className="absolute top-1 right-1 w-6 h-6 opacity-5">
              <img 
                src="/images/liberchat-logo.svg" 
                alt="" 
                className="w-full h-full"
              />
            </div>
            <p className="text-gray-400 relative z-10">En attente d'autres camarades...</p>
          </div>
        )}
      </div>
    </div>
  );
};