import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  late IO.Socket socket;

  void connect({required Function(dynamic) onMessage, required Function() onConnect, required Function(dynamic) onError}) {
    socket = IO.io(
      'https://liberchat-3-0-1.onrender.com',
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .build(),
    );

    socket.onConnect((_) => onConnect());
    socket.on('chat message', (data) => onMessage(data));
    socket.onError((err) => onError(err));
    socket.connect();
  }

  void sendChatMessage(Map<String, dynamic> message) {
    socket.emit('chat message', message);
  }

  void sendMessage(dynamic message) {
    if (message is Map) {
      socket.emit('message', jsonEncode(message));
    } else {
      socket.emit('message', message);
    }
  }

  void disconnect() {
    socket.disconnect();
  }
}
