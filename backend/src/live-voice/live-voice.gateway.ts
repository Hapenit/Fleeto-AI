import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LiveVoiceEvent } from './types/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { TelemetryService } from '../telemetry/telemetry.service.js';

const websocketOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  namespace: '/live-voice',
  cors: {
    origin: websocketOrigins,
    credentials: true,
  },
})
export class LiveVoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveVoiceGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly telemetry: TelemetryService,
  ) {}

  async handleConnection(client: Socket) {
    const requestId = randomUUID();
    client.data.requestId = requestId;
    try {
      const authorizationHeader = client.handshake.headers?.authorization;
      const token =
        client.handshake.auth?.token ||
        (typeof authorizationHeader === 'string' ? authorizationHeader.replace(/^Bearer\s+/i, '') : undefined);

      if (!token) {
        throw new Error('Unauthorized');
      }

      const accessSecret = process.env.JWT_ACCESS_SECRET || 'super-secret-access-key-for-development';
      const payload = this.jwtService.verify(token, { secret: accessSecret });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User is not active');
      }

      (client as any).user = { ...payload, ...user };
      this.logger.log(JSON.stringify({ event: 'websocket_connected', requestId }));
    } catch (error: unknown) {
      this.logger.warn(JSON.stringify({
        event: 'websocket_connection_rejected',
        requestId,
        reason: error instanceof Error ? error.name : 'unknown',
      }));
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(JSON.stringify({
      event: 'websocket_disconnected',
      requestId: client.data.requestId ?? 'unknown',
    }));
  }

  @SubscribeMessage('joinCall')
  async handleJoinCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { callId: string }
  ) {
    if (!payload?.callId) return;

    const user = (client as any).user;
    if (!user) return;

    const call = await this.prisma.voiceCall.findUnique({
      where: { id: payload.callId },
      select: { id: true },
    });

    if (!call) {
      this.logger.warn(JSON.stringify({ event: 'websocket_join_rejected', reason: 'call_not_found' }));
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'MARKETING_USER') {
      this.logger.warn(JSON.stringify({ event: 'websocket_join_rejected', reason: 'invalid_role' }));
      return;
    }

    await client.join(`call_${payload.callId}`);
    this.logger.log(JSON.stringify({
      event: 'websocket_joined_call',
      requestId: client.data.requestId ?? 'unknown',
    }));
  }

  @SubscribeMessage('leaveCall')
  async handleLeaveCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { callId: string }
  ) {
    if (!payload?.callId) return;
    await client.leave(`call_${payload.callId}`);
    this.logger.log(JSON.stringify({
      event: 'websocket_left_call',
      requestId: client.data.requestId ?? 'unknown',
    }));
  }

  broadcastEvent(callId: string, event: LiveVoiceEvent) {
    this.server.to(`call_${callId}`).emit('live_event', event);
  }
}
