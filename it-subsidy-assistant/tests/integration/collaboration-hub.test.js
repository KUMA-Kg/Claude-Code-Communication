import { io as ioClient } from 'socket.io-client';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

describe('Collaboration Hub Integration Tests', () => {
  let socket1, socket2;
  let roomId;
  const baseURL = process.env.TEST_API_URL || 'http://localhost:3001';
  
  // Test users
  const user1 = {
    id: 'test-user-1',
    name: 'Test User 1',
    email: 'user1@test.com'
  };
  
  const user2 = {
    id: 'test-user-2', 
    name: 'Test User 2',
    email: 'user2@test.com'
  };

  beforeAll((done) => {
    // Setup socket connections
    socket1 = ioClient(`${baseURL}/collaboration`, {
      auth: {
        token: 'test-token-1' // In real tests, use actual JWT tokens
      }
    });

    socket2 = ioClient(`${baseURL}/collaboration`, {
      auth: {
        token: 'test-token-2'
      }
    });

    let connected = 0;
    const checkConnected = () => {
      connected++;
      if (connected === 2) done();
    };

    socket1.on('connect', checkConnected);
    socket2.on('connect', checkConnected);
  });

  afterAll(() => {
    socket1.close();
    socket2.close();
  });

  beforeEach(() => {
    roomId = `test-room-${Date.now()}`;
  });

  describe('Room Management', () => {
    it('should allow users to join a room', (done) => {
      socket1.emit('join-room', {
        roomId,
        subsidyId: '123',
        user: user1
      });

      socket1.on('room-joined', (data) => {
        expect(data.roomId).toBe(roomId);
        expect(data.user).toMatchObject(user1);
        expect(data.users).toHaveLength(1);
        done();
      });
    });

    it('should notify other users when someone joins', (done) => {
      // First user joins
      socket1.emit('join-room', {
        roomId,
        subsidyId: '123',
        user: user1
      });

      socket1.on('room-joined', () => {
        // Second user joins
        socket2.emit('join-room', {
          roomId,
          subsidyId: '123',
          user: user2
        });
      });

      // First user should be notified
      socket1.on('user-joined', (data) => {
        expect(data.user).toMatchObject(user2);
        done();
      });
    });

    it('should notify when users leave', (done) => {
      // Both users join
      socket1.emit('join-room', { roomId, subsidyId: '123', user: user1 });
      socket2.emit('join-room', { roomId, subsidyId: '123', user: user2 });

      socket2.on('room-joined', () => {
        // User 2 leaves
        socket2.emit('leave-room', { roomId });
      });

      // User 1 should be notified
      socket1.on('user-left', (data) => {
        expect(data.userId).toBe(user2.id);
        done();
      });
    });
  });

  describe('Real-time Collaboration', () => {
    beforeEach((done) => {
      // Both users join the room
      let joined = 0;
      const checkJoined = () => {
        joined++;
        if (joined === 2) done();
      };

      socket1.emit('join-room', { roomId, subsidyId: '123', user: user1 });
      socket2.emit('join-room', { roomId, subsidyId: '123', user: user2 });

      socket1.on('room-joined', checkJoined);
      socket2.on('room-joined', checkJoined);
    });

    it('should broadcast cursor movements', (done) => {
      const cursor = { x: 50, y: 100 };

      socket1.emit('cursor-move', { roomId, cursor });

      socket2.on('cursor-moved', (data) => {
        expect(data.userId).toBe(user1.id);
        expect(data.cursor).toEqual(cursor);
        done();
      });
    });

    it('should broadcast element selection', (done) => {
      const elementId = 'section-overview';

      socket1.emit('element-select', { roomId, elementId });

      socket2.on('element-selected', (data) => {
        expect(data.userId).toBe(user1.id);
        expect(data.elementId).toBe(elementId);
        done();
      });
    });

    it('should handle document changes', (done) => {
      const changes = {
        sectionId: 'overview',
        content: 'Updated content'
      };

      socket1.emit('document-change', {
        roomId,
        changes,
        version: 0
      });

      socket2.on('document-changed', (data) => {
        expect(data.userId).toBe(user1.id);
        expect(data.changes).toEqual(changes);
        expect(data.version).toBe(1);
        done();
      });
    });

    it('should detect version conflicts', (done) => {
      // Both users try to edit at version 0
      const changes1 = { sectionId: 'overview', content: 'User 1 content' };
      const changes2 = { sectionId: 'overview', content: 'User 2 content' };

      socket1.emit('document-change', {
        roomId,
        changes: changes1,
        version: 0
      });

      // Wait a bit then user 2 tries to edit
      setTimeout(() => {
        socket2.emit('document-change', {
          roomId,
          changes: changes2,
          version: 0 // Same version = conflict
        });
      }, 100);

      socket2.on('document-conflict', (data) => {
        expect(data.currentVersion).toBe(1);
        expect(data.changes).toEqual(changes2);
        done();
      });
    });
  });

  describe('Whiteboard Collaboration', () => {
    beforeEach((done) => {
      socket1.emit('join-room', { roomId, subsidyId: '123', user: user1 });
      socket2.emit('join-room', { roomId, subsidyId: '123', user: user2 });
      
      let joined = 0;
      const checkJoined = () => {
        joined++;
        if (joined === 2) done();
      };
      
      socket1.on('room-joined', checkJoined);
      socket2.on('room-joined', checkJoined);
    });

    it('should sync whiteboard strokes', (done) => {
      const stroke = {
        id: 'stroke-1',
        userId: user1.id,
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        color: '#000000',
        width: 2,
        timestamp: Date.now()
      };

      socket1.emit('whiteboard-stroke', { roomId, stroke });

      socket2.on('whiteboard-stroke-added', (data) => {
        expect(data.stroke).toMatchObject(stroke);
        done();
      });
    });

    it('should sync whiteboard shapes', (done) => {
      const shape = {
        id: 'shape-1',
        userId: user1.id,
        type: 'rectangle',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        color: '#FF0000',
        timestamp: Date.now()
      };

      socket1.emit('whiteboard-shape', { roomId, shape });

      socket2.on('whiteboard-shape-added', (data) => {
        expect(data.shape).toMatchObject(shape);
        done();
      });
    });
  });

  describe('Activity Tracking', () => {
    it('should track user activities', (done) => {
      socket1.emit('join-room', { roomId, subsidyId: '123', user: user1 });

      socket1.on('activity', (activity) => {
        if (activity.type === 'join') {
          expect(activity.userId).toBe(user1.id);
          expect(activity.description).toContain(user1.name);
          done();
        }
      });
    });

    it('should broadcast activities to all users', (done) => {
      socket1.emit('join-room', { roomId, subsidyId: '123', user: user1 });
      socket2.emit('join-room', { roomId, subsidyId: '123', user: user2 });

      let activitiesReceived = 0;
      
      socket1.on('activity', (activity) => {
        activitiesReceived++;
        if (activitiesReceived === 2) { // After both users join
          done();
        }
      });
    });
  });

  describe('Sync and Recovery', () => {
    it('should sync state on request', (done) => {
      // Setup initial state
      socket1.emit('join-room', { roomId, subsidyId: '123', user: user1 });
      
      socket1.on('room-joined', () => {
        // Add some data
        const annotation = {
          id: 'ann-1',
          userId: user1.id,
          elementId: 'section-1',
          text: 'Test annotation',
          position: { x: 10, y: 20 },
          timestamp: Date.now()
        };
        
        socket1.emit('add-annotation', { roomId, annotation });
        
        // User 2 joins and requests sync
        socket2.emit('join-room', { roomId, subsidyId: '123', user: user2 });
      });

      socket2.on('room-joined', () => {
        socket2.emit('request-sync', { roomId });
      });

      socket2.on('sync-response', (data) => {
        expect(data.users).toHaveLength(2);
        expect(data.annotations).toHaveLength(1);
        expect(data.documentVersion).toBeGreaterThanOrEqual(0);
        done();
      });
    });
  });
});

// Performance test
describe('Collaboration Hub Performance', () => {
  it('should handle multiple concurrent users', async () => {
    const userCount = 10;
    const sockets = [];
    const roomId = `perf-test-${Date.now()}`;

    // Create multiple socket connections
    for (let i = 0; i < userCount; i++) {
      const socket = ioClient(`${baseURL}/collaboration`, {
        auth: { token: `test-token-${i}` }
      });
      sockets.push(socket);
    }

    // All users join
    const joinPromises = sockets.map((socket, i) => {
      return new Promise((resolve) => {
        socket.emit('join-room', {
          roomId,
          subsidyId: '123',
          user: {
            id: `user-${i}`,
            name: `User ${i}`,
            email: `user${i}@test.com`
          }
        });
        socket.on('room-joined', resolve);
      });
    });

    await Promise.all(joinPromises);

    // Simulate concurrent cursor movements
    const startTime = Date.now();
    const movePromises = sockets.map((socket, i) => {
      return new Promise((resolve) => {
        socket.emit('cursor-move', {
          roomId,
          cursor: { x: i * 10, y: i * 10 }
        });
        setTimeout(resolve, 100);
      });
    });

    await Promise.all(movePromises);
    const endTime = Date.now();

    // Performance assertion
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

    // Cleanup
    sockets.forEach(socket => socket.close());
  });
});