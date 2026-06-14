import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DmService } from '../dm.service';
import { UseFilters, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/dm',
})
export class DmGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DmGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dmService: DmService,
  ) {}

  /** JWT Authentication on Socket connection */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: Token missing. Socket ID: ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user payload to client socket
      (client as any).user = payload;
      this.logger.log(`Client authenticated: User ID ${payload.sub}, Socket ID: ${client.id}`);
    } catch (err) {
      this.logger.warn(`Connection rejected: Invalid token. Error: ${err.message}`);
      client.disconnect();
    }
  }

  /** Client requests to join a conversation room */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) {
      client.disconnect();
      return;
    }

    const { conversationId } = data;
    if (!conversationId) return;

    try {
      // Security check: Verify user is a member of this conversation
      await this.dmService.getConversation(user.sub, conversationId);
      
      // Join Socket.IO room
      await client.join(conversationId);
      this.logger.log(`User ${user.sub} joined conversation room: ${conversationId}`);
    } catch (err) {
      this.logger.error(`User ${user.sub} failed to join room ${conversationId}: ${err.message}`);
      client.emit('error', { message: 'Sohbet odasına katılma yetkiniz yok.' });
    }
  }

  /** Client sends a message in a conversation */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) {
      client.disconnect();
      return;
    }

    const { conversationId, content } = data;
    if (!conversationId || !content || !content.trim()) {
      client.emit('error', { message: 'Geçersiz mesaj verisi.' });
      return;
    }

    try {
      // 1. Save to PostgreSQL database
      const savedMessage = await this.dmService.sendMessage(user.sub, conversationId, { content });

      // 2. Emit "new_message" to all users in the conversation room
      this.server.to(conversationId).emit('new_message', savedMessage);

      // 3. Emit "message_received" back to the sender
      client.emit('message_received', savedMessage);
    } catch (err) {
      this.logger.error(`Failed to send message from ${user.sub}: ${err.message}`);
      client.emit('error', { message: 'Mesaj gönderilemedi.' });
    }
  }

  /** Helper to extract JWT token from connection payload */
  private extractToken(client: Socket): string | null {
    // 1. Check handshake authentication option (e.g. socket.io auth)
    let token = client.handshake.auth?.token;

    // 2. Check headers
    if (!token && client.handshake.headers?.authorization) {
      token = client.handshake.headers.authorization;
    }

    // 3. Check query string
    if (!token && client.handshake.query?.token) {
      token = client.handshake.query.token as string;
    }

    if (!token) return null;

    // Remove "Bearer " prefix if present
    if (token.startsWith('Bearer ')) {
      return token.substring(7);
    }

    return token;
  }
}
