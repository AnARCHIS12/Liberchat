import 'package:flutter/material.dart';
import 'package:flutter_custom_tabs/flutter_custom_tabs.dart';
import 'package:flutter/services.dart';

const String kWebviewUrl = 'https://liberchat-3-0-1.onrender.com/';

class WebviewScreen extends StatefulWidget {
  const WebviewScreen({super.key});

  @override
  State<WebviewScreen> createState() => _WebviewScreenState();
}

class _WebviewScreenState extends State<WebviewScreen> {
  String? micDebug;
  bool showOpenInChrome = false;
  bool _hasOpened = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _openInChrome();
      setState(() {
        _hasOpened = true;
      });
    });
  }

  Future<void> _openInChrome() async {
    final url = kWebviewUrl; // Utilisation de la variable globale
    try {
      await launch(
        url,
        customTabsOption: CustomTabsOption(
          enableUrlBarHiding: true,
          showPageTitle: false,
        ),
        safariVCOption: SafariViewControllerOption(
          preferredBarTintColor: Color(0xFFB71C1C),
          preferredControlTintColor: Colors.white,
          barCollapsingEnabled: true,
          entersReaderIfAvailable: false,
          dismissButtonStyle: SafariViewControllerDismissButtonStyle.close,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible d\'ouvrir le navigateur.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFB71C1C),
      body: Center(
        child: !_hasOpened
            ? const SizedBox.shrink()
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.open_in_browser, color: Colors.white, size: 64),
                  const SizedBox(height: 24),
                  const Text(
                    'Accéder à Liberchat',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Ouvrir Liberchat'),
                    onPressed: _openInChrome,
                  ),
                ],
              ),
      ),
    );
  }
}
