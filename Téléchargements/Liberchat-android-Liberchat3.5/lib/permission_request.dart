import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

Future<void> requestMicrophonePermission(BuildContext context) async {
  final status = await Permission.microphone.request();
  if (status.isDenied) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Le micro est nécessaire pour utiliser cette fonctionnalité.')),
    );
  }
}
