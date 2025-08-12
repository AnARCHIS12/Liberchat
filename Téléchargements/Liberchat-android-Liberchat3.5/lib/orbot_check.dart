import 'dart:io';

Future<bool> isOrbotRunning({String host = '127.0.0.1', int port = 9050}) async {
  try {
    final socket = await Socket.connect(host, port, timeout: const Duration(milliseconds: 700));
    socket.destroy();
    return true;
  } catch (_) {
    return false;
  }
}
