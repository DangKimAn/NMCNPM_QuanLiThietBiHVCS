import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token, disconnecting`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const userId = payload.sub;
      const role = payload.role;

      client.data.userId = userId;
      client.data.role = role;

      client.join(`role:${role}`);
      client.join('role:ALL');
      client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id} (user:${userId}, role:${role})`);
    } catch {
      this.logger.warn(`Client ${client.id} authentication failed, disconnecting`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitNotification(data: any) {
    // Nếu có targetUserId cụ thể → chỉ gửi cho user đó
    if (data.targetUserId) {
      this.server.to(`user:${data.targetUserId}`).emit('notification_created', data);
      return;
    }

    // Ngược lại: gửi theo targetRole
    if (data.targetRole === 'ALL') {
      this.server.to('role:ALL').emit('notification_created', data);
    } else {
      this.server.to(`role:${data.targetRole}`).emit('notification_created', data);
    }
  }

  emitReportCreated(data: any) {
    this.server.emit('report_created', data);
  }

  emitReportUpdated(data: any) {
    this.server.emit('report_updated', data);
  }

  emitEquipmentTransferred(data: any) {
    this.server.emit('equipment_transferred', data);
  }
}
