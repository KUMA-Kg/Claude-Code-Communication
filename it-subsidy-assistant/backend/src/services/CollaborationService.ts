import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/config';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number };
  activeElement?: string;
}

interface Room {
  id: string;
  subsidyId: string;
  users: Map<string, User>;
  whiteboard: WhiteboardData;
  annotations: Map<string, Annotation>;
  documentVersion: number;
}

interface WhiteboardData {
  strokes: Stroke[];
  shapes: Shape[];
}

interface Stroke {
  id: string;
  userId: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  timestamp: number;
}

interface Shape {
  id: string;
  userId: string;
  type: 'rectangle' | 'circle' | 'text';
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  text?: string;
  timestamp: number;
}

interface Annotation {
  id: string;
  userId: string;
  elementId: string;
  text: string;
  position: { x: number; y: number };
  timestamp: number;
}

interface Activity {
  id: string;
  roomId: string;
  userId: string;
  type: 'join' | 'leave' | 'edit' | 'comment' | 'whiteboard' | 'annotation';
  description: string;
  timestamp: number;
  metadata?: any;
}

export class CollaborationService {
  private io: SocketIOServer;
  private rooms: Map<string, Room> = new Map();
  private userSockets: Map<string, Socket> = new Map();
  private userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F06292', '#AED581', '#FFD54F', '#4FC3F7', '#BA68C8'
  ];

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('New collaboration connection:', socket.id);

      socket.on('join-room', async (data: { roomId: string; subsidyId: string; user: Partial<User> }) => {
        await this.handleJoinRoom(socket, data);
      });

      socket.on('leave-room', async (data: { roomId: string }) => {
        await this.handleLeaveRoom(socket, data);
      });

      socket.on('cursor-move', (data: { roomId: string; cursor: { x: number; y: number } }) => {
        this.handleCursorMove(socket, data);
      });

      socket.on('element-select', (data: { roomId: string; elementId: string }) => {
        this.handleElementSelect(socket, data);
      });

      socket.on('document-change', async (data: { roomId: string; changes: any; version: number }) => {
        await this.handleDocumentChange(socket, data);
      });

      socket.on('whiteboard-stroke', async (data: { roomId: string; stroke: Stroke }) => {
        await this.handleWhiteboardStroke(socket, data);
      });

      socket.on('whiteboard-shape', async (data: { roomId: string; shape: Shape }) => {
        await this.handleWhiteboardShape(socket, data);
      });

      socket.on('add-annotation', async (data: { roomId: string; annotation: Annotation }) => {
        await this.handleAddAnnotation(socket, data);
      });

      socket.on('remove-annotation', async (data: { roomId: string; annotationId: string }) => {
        await this.handleRemoveAnnotation(socket, data);
      });

      socket.on('request-sync', (data: { roomId: string }) => {
        this.handleSyncRequest(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinRoom(socket: Socket, data: { roomId: string; subsidyId: string; user: Partial<User> }) {
    const { roomId, subsidyId, user } = data;

    // Create or get room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        subsidyId,
        users: new Map(),
        whiteboard: { strokes: [], shapes: [] },
        annotations: new Map(),
        documentVersion: 0
      };
      this.rooms.set(roomId, room);
    }

    // Create user with color
    const fullUser: User = {
      id: user.id || uuidv4(),
      name: user.name || 'Anonymous',
      email: user.email || '',
      color: this.userColors[room.users.size % this.userColors.length]
    };

    // Add user to room
    room.users.set(socket.id, fullUser);
    this.userSockets.set(socket.id, socket);
    socket.join(roomId);

    // Send room state to new user
    socket.emit('room-joined', {
      roomId,
      user: fullUser,
      users: Array.from(room.users.values()),
      whiteboard: room.whiteboard,
      annotations: Array.from(room.annotations.values()),
      documentVersion: room.documentVersion
    });

    // Notify others
    socket.to(roomId).emit('user-joined', {
      user: fullUser
    });

    // Log activity
    await this.logActivity({
      id: uuidv4(),
      roomId,
      userId: fullUser.id,
      type: 'join',
      description: `${fullUser.name} joined the collaboration`,
      timestamp: Date.now()
    });
  }

  private async handleLeaveRoom(socket: Socket, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      room.users.delete(socket.id);
      socket.leave(roomId);

      // Notify others
      socket.to(roomId).emit('user-left', {
        userId: user.id
      });

      // Log activity
      await this.logActivity({
        id: uuidv4(),
        roomId,
        userId: user.id,
        type: 'leave',
        description: `${user.name} left the collaboration`,
        timestamp: Date.now()
      });

      // Clean up empty rooms
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  private handleCursorMove(socket: Socket, data: { roomId: string; cursor: { x: number; y: number } }) {
    const { roomId, cursor } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      user.cursor = cursor;
      
      // Broadcast to others in room
      socket.to(roomId).emit('cursor-moved', {
        userId: user.id,
        cursor
      });
    }
  }

  private handleElementSelect(socket: Socket, data: { roomId: string; elementId: string }) {
    const { roomId, elementId } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      user.activeElement = elementId;
      
      // Broadcast to others in room
      socket.to(roomId).emit('element-selected', {
        userId: user.id,
        elementId
      });
    }
  }

  private async handleDocumentChange(socket: Socket, data: { roomId: string; changes: any; version: number }) {
    const { roomId, changes, version } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    // Simple version control - reject if version mismatch
    if (version !== room.documentVersion) {
      socket.emit('document-conflict', {
        currentVersion: room.documentVersion,
        changes
      });
      return;
    }

    // Apply changes and increment version
    room.documentVersion++;

    // Broadcast to others
    socket.to(roomId).emit('document-changed', {
      userId: user.id,
      changes,
      version: room.documentVersion
    });

    // Save to database
    await this.saveDocumentChanges(roomId, room.subsidyId, changes, room.documentVersion);

    // Log activity
    await this.logActivity({
      id: uuidv4(),
      roomId,
      userId: user.id,
      type: 'edit',
      description: `${user.name} made changes to the document`,
      timestamp: Date.now(),
      metadata: { changes }
    });
  }

  private async handleWhiteboardStroke(socket: Socket, data: { roomId: string; stroke: Stroke }) {
    const { roomId, stroke } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    // Add stroke to room
    room.whiteboard.strokes.push(stroke);

    // Broadcast to others
    socket.to(roomId).emit('whiteboard-stroke-added', {
      stroke
    });

    // Log activity
    await this.logActivity({
      id: uuidv4(),
      roomId,
      userId: user.id,
      type: 'whiteboard',
      description: `${user.name} drew on the whiteboard`,
      timestamp: Date.now()
    });
  }

  private async handleWhiteboardShape(socket: Socket, data: { roomId: string; shape: Shape }) {
    const { roomId, shape } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    // Add shape to room
    room.whiteboard.shapes.push(shape);

    // Broadcast to others
    socket.to(roomId).emit('whiteboard-shape-added', {
      shape
    });

    // Log activity
    await this.logActivity({
      id: uuidv4(),
      roomId,
      userId: user.id,
      type: 'whiteboard',
      description: `${user.name} added a ${shape.type} to the whiteboard`,
      timestamp: Date.now()
    });
  }

  private async handleAddAnnotation(socket: Socket, data: { roomId: string; annotation: Annotation }) {
    const { roomId, annotation } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    // Add annotation to room
    room.annotations.set(annotation.id, annotation);

    // Broadcast to others
    socket.to(roomId).emit('annotation-added', {
      annotation
    });

    // Log activity
    await this.logActivity({
      id: uuidv4(),
      roomId,
      userId: user.id,
      type: 'annotation',
      description: `${user.name} added an annotation`,
      timestamp: Date.now()
    });
  }

  private async handleRemoveAnnotation(socket: Socket, data: { roomId: string; annotationId: string }) {
    const { roomId, annotationId } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    // Remove annotation from room
    room.annotations.delete(annotationId);

    // Broadcast to others
    socket.to(roomId).emit('annotation-removed', {
      annotationId
    });
  }

  private handleSyncRequest(socket: Socket, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    // Send current room state
    socket.emit('sync-response', {
      users: Array.from(room.users.values()),
      whiteboard: room.whiteboard,
      annotations: Array.from(room.annotations.values()),
      documentVersion: room.documentVersion
    });
  }

  private handleDisconnect(socket: Socket) {
    // Find and leave all rooms
    this.rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        this.handleLeaveRoom(socket, { roomId });
      }
    });

    this.userSockets.delete(socket.id);
  }

  private async saveDocumentChanges(roomId: string, subsidyId: string, changes: any, version: number) {
    try {
      await pool.query(
        `INSERT INTO collaboration_history (room_id, subsidy_id, changes, version, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [roomId, subsidyId, JSON.stringify(changes), version]
      );
    } catch (error) {
      console.error('Error saving document changes:', error);
    }
  }

  private async logActivity(activity: Activity) {
    try {
      await pool.query(
        `INSERT INTO collaboration_activities (id, room_id, user_id, type, description, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [activity.id, activity.roomId, activity.userId, activity.type, activity.description, JSON.stringify(activity.metadata || {})]
      );

      // Emit activity to room
      this.io.to(activity.roomId).emit('activity', activity);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  public async getActivities(roomId: string, limit: number = 50): Promise<Activity[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM collaboration_activities 
         WHERE room_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [roomId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }
}