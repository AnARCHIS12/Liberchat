class Message {
  final String id;
  final String user;
  final String content;
  final DateTime timestamp;

  Message({
    required this.id,
    required this.user,
    required this.content,
    required this.timestamp,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as String,
      user: json['user'] as String,
      content: json['content'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}
