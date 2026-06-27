import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Trong thực tế nên giới hạn origin
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Phát sự kiện có thông báo mới
  emitNotification(data: any) {
    this.server.emit('notification_created', data);
  }

  // Phát sự kiện có báo hỏng mới (dành cho Manager)
  emitReportCreated(data: any) {
    this.server.emit('report_created', data);
  }

  // Phát sự kiện báo hỏng được cập nhật (dành cho sinh viên và manager)
  emitReportUpdated(data: any) {
    this.server.emit('report_updated', data);
  }

  // Phát sự kiện thiết bị được điều chuyển
  emitEquipmentTransferred(data: any) {
    this.server.emit('equipment_transferred', data);
  }
}
