import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'orbot_check.dart';

Future<void> showOrbotHelpDialog(BuildContext context) async {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Orbot non détecté'),
      content: const Text(
        'Le mode Tor nécessite Orbot.\n\nVeuillez démarrer Orbot (ou activer le proxy Tor) sur votre appareil, puis réessayez.\n\nOrbot est disponible gratuitement sur Google Play et F-Droid.',
      ),
      actions: [
        TextButton(
          onPressed: () async {
            const orbotPlay = 'https://play.google.com/store/apps/details?id=org.torproject.android';
            const orbotFdroid = 'https://f-droid.org/packages/org.torproject.android/';
            final url = await canLaunchUrl(Uri.parse(orbotPlay)) ? orbotPlay : orbotFdroid;
            await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
          },
          child: const Text('Installer Orbot'),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('OK'),
        ),
      ],
    ),
  );
}
