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
    <div className="w-64 bg-black border-r-2 border-red-900 flex flex-col">
      <div className="p-4 border-b-2 border-red-900">
        <h2 className="text-2xl font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
          Camarades
          <span className="text-xl">☭</span>
          <span className="text-xl">Ⓐ</span>
          <span className="text-xl">⚑</span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {users.map((user) => (
          <div
            key={user.socketId}
            className={`flex items-center gap-2 p-2 hover:bg-red-900/20 border border-red-900/30 transition-colors rounded-lg ${user.username === currentUser ? 'bg-red-500/10 text-red-400' : ''}`}
          >
            <span className="text-lg">Ⓐ</span>
            <span className="text-red-200 uppercase">{user.username}{user.username === currentUser && ' (vous)'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};