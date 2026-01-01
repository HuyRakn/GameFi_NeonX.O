/**
 * Backend Server for Neon X.O
 * NestJS + Socket.io for real-time multiplayer
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for mobile app
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    const PORT = process.env.PORT || 3000;
    await app.listen(PORT);
    
    console.log(`🚀 Neon X.O Backend running on port ${PORT}`);
    console.log(`📡 Socket.io ready at ws://localhost:${PORT}`);
    console.log(`🌐 HTTP API ready at http://localhost:${PORT}`);
    console.log(`✅ Server is ready to accept connections`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap error:', error);
  process.exit(1);
});

