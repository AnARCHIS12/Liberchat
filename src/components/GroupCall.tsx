import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import Peer from 'simple-peer';

interface User {
  username: string;
  socketId: string;
}

interface Group {
  id: string;
  name: string;
  members: string[];
  calls: string[];
}

interface GroupCallProps {
  socket: Socket;
  username: string;
}

export const GroupCall = ({ socket, username }: GroupCallProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<{ [key: string]: Peer.Instance }>({});
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Gestion des utilisateurs et des groupes
  useEffect(() => {
    socket.on('users', (updatedUsers: User[]) => {
      console.log('Users updated:', updatedUsers);
      setUsers(updatedUsers.filter(user => user.username !== username));
    });

    socket.on('groups', (updatedGroups: Group[]) => {
      console.log('Groups updated:', updatedGroups);
      setGroups(updatedGroups);
    });

    socket.on('init', (data: { users: User[]; groups: Group[] }) => {
      console.log('Initial data received:', data);
      setUsers(data.users.filter(user => user.username !== username));
      setGroups(data.groups);
    });

    return () => {
      socket.off('users');
      socket.off('groups');
      socket.off('init');
    };
  }, [socket, username]);

  // Gestion des appels
  useEffect(() => {
    if (!activeGroup) return;

    const initializeMedia = async () => {
      try {
        // Vérifier d'abord si les médias sont déjà actifs
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            stream.removeTrack(track);
          });
        }

        // Demander les permissions avec des contraintes optimisées
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
            aspectRatio: { ideal: 1.7777777778 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        console.log('Media stream obtained:', mediaStream);
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(e => {
            console.error('Error playing video:', e);
            setError('Erreur lors de la lecture de la vidéo');
          });
        }
        
        // Notifier les autres utilisateurs
        socket.emit('joinGroupCall', { groupId: activeGroup.id });
        setError('');
        
      } catch (err) {
        console.error('Error accessing media devices:', err);
        let errorMessage = 'Erreur d\'accès aux périphériques média. ';
        
        if (err instanceof DOMException) {
          switch (err.name) {
            case 'NotFoundError':
              errorMessage += 'Aucun périphérique média trouvé.';
              break;
            case 'NotAllowedError':
              errorMessage += 'Veuillez autoriser l\'accès à la caméra et au microphone.';
              break;
            case 'NotReadableError':
              errorMessage += 'Périphérique média déjà utilisé.';
              break;
            default:
              errorMessage += 'Veuillez vérifier vos périphériques et réessayer.';
          }
        }
        
        setError(errorMessage);
      }
    };

    initializeMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          stream.removeTrack(track);
        });
      }
      Object.values(peers).forEach(peer => {
        peer.destroy();
      });
      setPeers({});
      socket.emit('leaveGroupCall', { groupId: activeGroup.id });
    };
  }, [activeGroup]);

  // Gestion des événements d'appel
  useEffect(() => {
    if (!stream || !activeGroup) return;

    socket.on('userJoinedCall', ({ user, signal, groupId }) => {
      console.log('User joined call:', user);
      if (groupId !== activeGroup.id) return;

      const peer = new Peer({
        initiator: false,
        stream,
        trickle: false
      });

      peer.on('signal', (data) => {
        socket.emit('answerGroupCall', {
          to: user,
          signal: data,
          groupId: activeGroup.id
        });
      });

      peer.signal(signal);
      setPeers(prev => ({ ...prev, [user]: peer }));
    });

    socket.on('groupCallAccepted', ({ from, signal }) => {
      console.log('Call accepted by:', from);
      const peer = peers[from];
      if (peer) {
        peer.signal(signal);
      }
    });

    socket.on('userLeftCall', ({ user }) => {
      console.log('User left call:', user);
      if (peers[user]) {
        peers[user].destroy();
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[user];
          return newPeers;
        });
      }
    });

    return () => {
      socket.off('userJoinedCall');
      socket.off('groupCallAccepted');
      socket.off('userLeftCall');
    };
  }, [socket, stream, activeGroup, peers]);

  const handleJoinCall = (group: Group) => {
    setActiveGroup(group);
    console.log('Joining call for group:', group.name);

    group.members.forEach(member => {
      if (member !== username && !peers[member]) {
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: stream!
        });

        peer.on('signal', (data) => {
          socket.emit('joinGroupCall', {
            to: member,
            groupId: group.id,
            signalData: data
          });
        });

        setPeers(prev => ({ ...prev, [member]: peer }));
      }
    });
  };

  const handleLeaveCall = () => {
    if (!activeGroup) return;

    socket.emit('leaveGroupCall', { groupId: activeGroup.id });
    setActiveGroup(null);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    Object.values(peers).forEach(peer => peer.destroy());
    setPeers({});
  };

  const handleUserSelect = (username: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(username)) {
        return prev.filter(u => u !== username);
      }
      return [...prev, username];
    });
  };

  const createGroup = () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      setError('Veuillez entrer un nom de groupe et sélectionner au moins un membre');
      return;
    }
    socket.emit('createGroup', {
      name: groupName,
      members: [...selectedUsers, username]
    });
    setGroupName('');
    setSelectedUsers([]);
    setError('');
  };

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Panneau de gauche : Création de groupe et liste des membres */}
      <div className="w-1/3 bg-gray-800 rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Gestion des Groupes</h2>
        
        {/* Création de groupe */}
        <form onSubmit={(e) => { e.preventDefault(); createGroup(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du groupe
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Entrez le nom du groupe"
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sélectionner les membres
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-700 rounded p-2">
              {users.map((user) => (
                <label key={user.socketId} className="flex items-center space-x-2 p-2 hover:bg-gray-600 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.username)}
                    onChange={() => handleUserSelect(user.username)}
                    className="form-checkbox h-4 w-4 text-blue-500"
                  />
                  <span className="text-white">{user.username}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={!groupName.trim() || selectedUsers.length === 0}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Créer le groupe
          </button>
        </form>

        {/* Liste des groupes */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-2">Groupes existants</h3>
          <div className="space-y-2">
            {groups.map((group) => (
              <div key={group.id} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">{group.name}</span>
                  <div className="space-x-2">
                    {!activeGroup || activeGroup.id !== group.id ? (
                      <button
                        onClick={() => handleJoinCall(group)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        Rejoindre
                      </button>
                    ) : (
                      <button
                        onClick={handleLeaveCall}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Quitter
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {group.members.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau de droite : Zone d'appel vidéo */}
      <div className="w-2/3 bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold text-white mb-4">
          {activeGroup ? `Appel en cours : ${activeGroup.name}` : 'Aucun appel en cours'}
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Vidéo locale */}
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg bg-gray-900"
            />
            <div className="absolute bottom-2 left-2 bg-gray-900/80 px-2 py-1 rounded text-sm text-white">
              Vous
            </div>
          </div>

          {/* Vidéos des pairs */}
          {Object.entries(peers).map(([peerId, peer]) => (
            <div key={peerId} className="relative">
              <video
                ref={(element) => {
                  if (element && peer.streams[0]) {
                    element.srcObject = peer.streams[0];
                  }
                }}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-gray-900"
              />
              <div className="absolute bottom-2 left-2 bg-gray-900/80 px-2 py-1 rounded text-sm text-white">
                {users.find(u => u.socketId === peerId)?.username || 'Utilisateur'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
