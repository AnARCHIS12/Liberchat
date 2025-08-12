import 'dart:convert';
import 'package:http/http.dart' as http;
import 'message_model.dart';

class ApiService {
  final String baseUrl;
  String? token;

  ApiService({required this.baseUrl});

  Future<bool> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      token = data['token'];
      return true;
    }
    return false;
  }

  Future<List<Message>> fetchMessages() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/messages'),
      headers: token != null ? {'Authorization': 'Bearer $token'} : {},
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Message.fromJson(json)).toList();
    }
    throw Exception('Erreur lors du chargement des messages');
  }

  Future<bool> sendMessage(String content) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/messages'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'content': content}),
    );
    return response.statusCode == 201;
  }
}
