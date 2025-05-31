import React from 'react';

interface UserInfo {
  username: string;
  socketId: string;
}

interface UserListProps {
  users: UserInfo[];
  currentUser: string;
}

export const UserList: React.FC<UserListProps> = ({ users, currentUser }) => {
  return (
    <aside className="w-full sm:w-64 bg-black border-r-4 border-red-700 flex flex-col shadow-lg z-0">
      <div className="p-2 sm:p-4 border-b-4 border-red-700 bg-black/90">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: 'Impact, sans-serif', letterSpacing: '0.12em' }}>
          Camarades
          <span className="text-lg align-middle">Ⓐ</span>
          <span className="text-lg align-middle">⚑</span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 sm:space-y-2 bg-gradient-to-b from-black via-red-950 to-black">
        {users.map((user) => (
          <div
            key={user.socketId}
            className={`flex items-center gap-2 p-2 border-2 rounded-lg transition-colors font-mono text-sm sm:text-base shadow ${user.username === currentUser ? 'bg-red-700/30 border-red-700 text-red-200 font-bold' : 'bg-black/70 border-red-900 text-white hover:bg-red-900/30'}`}
          >
            <span className="text-lg">Ⓐ</span>
            <span className="uppercase truncate">{user.username}{user.username === currentUser && ' (vous)'}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};