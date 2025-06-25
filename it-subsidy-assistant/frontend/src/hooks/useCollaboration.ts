import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number };
  activeElement?: string;
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

interface Annotation {
  id: string;
  userId: string;
  elementId: string;
  text: string;
  position: { x: number; y: number };
  timestamp: number;
}

export const useCollaboration = () => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [documentVersion, setDocumentVersion] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(`${import.meta.env.VITE_API_URL}/collaboration`, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
    });

    newSocket.on('room-joined', (data) => {
      setUsers(data.users);
      setAnnotations(data.annotations);
      setDocumentVersion(data.documentVersion);
    });

    newSocket.on('user-joined', (data) => {
      setUsers(prev => [...prev, data.user]);
    });

    newSocket.on('user-left', (data) => {
      setUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    newSocket.on('cursor-moved', (data) => {
      setUsers(prev => prev.map(u => 
        u.id === data.userId 
          ? { ...u, cursor: data.cursor }
          : u
      ));
    });

    newSocket.on('element-selected', (data) => {
      setUsers(prev => prev.map(u => 
        u.id === data.userId 
          ? { ...u, activeElement: data.elementId }
          : u
      ));
    });

    newSocket.on('document-changed', (data) => {
      setDocumentVersion(data.version);
      // Handle document changes here
    });

    newSocket.on('document-conflict', (data) => {
      console.warn('Document conflict detected', data);
      // Handle conflict resolution
    });

    newSocket.on('annotation-added', (data) => {
      setAnnotations(prev => [...prev, data.annotation]);
    });

    newSocket.on('annotation-removed', (data) => {
      setAnnotations(prev => prev.filter(a => a.id !== data.annotationId));
    });

    newSocket.on('activity', (data) => {
      setActivities(prev => [data, ...prev].slice(0, 100)); // Keep last 100 activities
    });

    newSocket.on('sync-response', (data) => {
      setUsers(data.users);
      setAnnotations(data.annotations);
      setDocumentVersion(data.documentVersion);
    });

    return () => {
      newSocket.close();
    };
  }, [token]);

  const joinRoom = useCallback((subsidyId: string, user: Partial<User>) => {
    if (!socket) return;

    const newRoomId = `room_${subsidyId}_${Date.now()}`;
    setRoomId(newRoomId);

    socket.emit('join-room', {
      roomId: newRoomId,
      subsidyId,
      user
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit('leave-room', { roomId });
    setRoomId(null);
    setUsers([]);
    setActivities([]);
    setAnnotations([]);
  }, [socket, roomId]);

  const sendCursorPosition = useCallback((cursor: { x: number; y: number }) => {
    if (!socket || !roomId) return;

    socket.emit('cursor-move', { roomId, cursor });
  }, [socket, roomId]);

  const selectElement = useCallback((elementId: string) => {
    if (!socket || !roomId) return;

    socket.emit('element-select', { roomId, elementId });
  }, [socket, roomId]);

  const sendDocumentChange = useCallback((changes: any) => {
    if (!socket || !roomId) return;

    socket.emit('document-change', { 
      roomId, 
      changes,
      version: documentVersion
    });
  }, [socket, roomId, documentVersion]);

  const addAnnotation = useCallback((annotation: Omit<Annotation, 'id' | 'timestamp'>) => {
    if (!socket || !roomId) return;

    const fullAnnotation: Annotation = {
      ...annotation,
      id: `ann_${Date.now()}`,
      timestamp: Date.now()
    };

    socket.emit('add-annotation', { roomId, annotation: fullAnnotation });
  }, [socket, roomId]);

  const removeAnnotation = useCallback((annotationId: string) => {
    if (!socket || !roomId) return;

    socket.emit('remove-annotation', { roomId, annotationId });
  }, [socket, roomId]);

  const requestSync = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit('request-sync', { roomId });
  }, [socket, roomId]);

  return {
    roomId,
    users,
    activities,
    annotations,
    isConnected,
    documentVersion,
    joinRoom,
    leaveRoom,
    sendCursorPosition,
    selectElement,
    sendDocumentChange,
    addAnnotation,
    removeAnnotation,
    requestSync
  };
};