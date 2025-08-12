import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'permission_request.dart';
import 'server_selection_screen.dart';
import 'orbot_check.dart';
import 'orbot_help_dialog.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Liberchat',
      theme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.red,
          brightness: Brightness.dark,
          primary: Colors.red.shade900,
          secondary: Colors.black,
        ),
        scaffoldBackgroundColor: Colors.black,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.black,
          foregroundColor: Colors.red,
        ),
        fontFamily: 'Roboto',
      ),
      home: const SplashScreen(),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  String? _selectedUrl;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.forward();
    _tryAutoConnect();
  }

  Future<void> _tryAutoConnect() async {
    final prefs = await SharedPreferences.getInstance();
    final lastUrl = prefs.getString('last_server_url');
    if (lastUrl != null && lastUrl.isNotEmpty) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => LiberchatWebView(serverUrl: lastUrl),
        ),
      );
    } else {
      Future.delayed(const Duration(seconds: 2), () {
        _showServerSelection();
      });
    }
  }

  void _showServerSelection() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ServerSelectionScreen(
          onServerSelected: (url) async {
            setState(() => _selectedUrl = url);
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('last_server_url', url);
            Navigator.pop(context);
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => LiberchatWebView(serverUrl: url),
              ),
            );
          },
        ),
      ),
    );
  }

  void _showChangeServerDialog() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('last_server_url');
    _showServerSelection();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.black, Colors.red],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          Center(
            child: FadeTransition(
              opacity: _animation,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(60),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.red.withOpacity(0.2),
                          blurRadius: 24,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Image.asset(
                        'assets/logo.png',
                        width: 120,
                        height: 120,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'LIBERCHAT',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                      shadows: [
                        Shadow(
                          color: Colors.red,
                          blurRadius: 12,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const CircularProgressIndicator(color: Colors.red),
                ],
              ),
            ),
          ),
          Positioned(
            top: 32,
            right: 24,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade900,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              icon: const Icon(Icons.swap_horiz),
              label: const Text('Changer de serveur'),
              onPressed: _showChangeServerDialog,
            ),
          ),
        ],
      ),
    );
  }
}

class LiberchatWebView extends StatefulWidget {
  final String serverUrl;
  const LiberchatWebView({super.key, required this.serverUrl});

  @override
  State<LiberchatWebView> createState() => _LiberchatWebViewState();
}

class _LiberchatWebViewState extends State<LiberchatWebView> {
  InAppWebViewController? _webViewController;
  bool _isLoading = true;
  bool _useTor = false; // Ajout du mode Tor
  bool _checkingOrbot = false;

  @override
  void initState() {
    super.initState();
    _loadTorState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      requestMicrophonePermission(context);
    });
  }

  Future<void> _loadTorState() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _useTor = prefs.getBool('use_tor') ?? false;
    });
  }

  Future<void> _saveTorState(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_tor', value);
  }

  Future<void> _toggleTor() async {
    if (!_useTor) {
      setState(() => _checkingOrbot = true);
      final running = await isOrbotRunning();
      setState(() => _checkingOrbot = false);
      if (!running) {
        showOrbotHelpDialog(context);
        return;
      }
    }
    setState(() {
      _useTor = !_useTor;
    });
    _saveTorState(!_useTor ? false : true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(44),
        child: AppBar(
          backgroundColor: Colors.black.withOpacity(0.7),
          elevation: 8,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
          ),
          title: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.asset('assets/logo.png', width: 36, height: 36),
              ),
              const SizedBox(width: 12),
              const Text(
                'Liberchat Mobile',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.swap_horiz),
              tooltip: 'Changer de serveur',
              onPressed: () async {
                final url = await Navigator.push<String>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ServerSelectionScreen(
                      onServerSelected: (url) {
                        Navigator.pop(context, url);
                      },
                    ),
                  ),
                );
                if (url != null && url.isNotEmpty && url != widget.serverUrl) {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => LiberchatWebView(serverUrl: url),
                    ),
                  );
                }
              },
            ),
            PopupMenuButton<int>(
              icon: const Icon(Icons.more_vert),
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 1,
                  child: Row(
                    children: [
                      const Icon(Icons.open_in_new, color: Colors.black),
                      const SizedBox(width: 8),
                      const Text('Ouvrir dans le navigateur'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 2,
                  child: Row(
                    children: [
                      Icon(Icons.circle, color: _isLoading ? Colors.red : Colors.green, size: 18),
                      const SizedBox(width: 8),
                      Text(_isLoading ? 'Déconnecté/chargement' : 'Connecté'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 3,
                  child: Row(
                    children: [
                      Icon(_useTor ? Icons.shield : Icons.shield_outlined, color: Colors.amber),
                      const SizedBox(width: 8),
                      Text(_useTor ? 'Désactiver Tor' : 'Activer Tor'),
                    ],
                  ),
                ),
              ],
              onSelected: (value) async {
                if (value == 1) {
                  String? url;
                  if (_webViewController != null) {
                    url = (await _webViewController?.getUrl())?.toString();
                  }
                  url ??= widget.serverUrl;
                  if (url.isNotEmpty) {
                    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('URL non disponible.')),
                    );
                  }
                } else if (value == 3) {
                  if (!_checkingOrbot) {
                    _toggleTor();
                  }
                }
              },
            ),
          ],
        ),
      ),
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.black, Colors.red],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: InAppWebView(
              initialUrlRequest: URLRequest(
                url: WebUri(widget.serverUrl),
              ),
              onWebViewCreated: (controller) {
                _webViewController = controller;
              },
              onLoadStart: (controller, url) {
                setState(() => _isLoading = true);
              },
              onLoadStop: (controller, url) {
                setState(() => _isLoading = false);
              },
              initialOptions: InAppWebViewGroupOptions(
                crossPlatform: InAppWebViewOptions(
                  useShouldOverrideUrlLoading: true,
                  mediaPlaybackRequiresUserGesture: false,
                  javaScriptEnabled: true,
                ),
                android: AndroidInAppWebViewOptions(
                  useHybridComposition: true,
                ),
              ),
              androidOnPermissionRequest: (controller, origin, resources) async {
                // N'accorder que la permission micro
                if (resources.contains('android.webkit.resource.AUDIO_CAPTURE')) {
                  return PermissionRequestResponse(
                    resources: resources,
                    action: PermissionRequestResponseAction.GRANT,
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Seule la permission micro est autorisée.')),
                  );
                  return PermissionRequestResponse(
                    resources: resources,
                    action: PermissionRequestResponseAction.DENY,
                  );
                }
              },
            ),
          ),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          if (_checkingOrbot)
            const Center(
              child: CircularProgressIndicator(color: Colors.amber),
            ),
        ],
      ),
    );
  }
}
