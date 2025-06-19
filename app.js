app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:3000 wss://liberchat-3-0-1.onrender.com wss://liberchat.onrender.com");
  next();
});