import { httpServer } from './app.js'; // Use .js extension for ESM

const PORT = process.env.PORT || 15645;

// Graceful shutdown 처리
const shutdown = () => {
  console.log('\n🛑 Shutting down server...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  // 5초 후 강제 종료
  setTimeout(() => {
    console.log('⚠️ Forcing shutdown...');
    process.exit(1);
  }, 5000);
};

// Ctrl+C (SIGINT) 및 SIGTERM 시그널 처리
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
