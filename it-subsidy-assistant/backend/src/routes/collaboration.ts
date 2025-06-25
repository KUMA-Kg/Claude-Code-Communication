import { Router } from 'express';
import { CollaborationService } from '../services/CollaborationService';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get collaboration activities for a room
router.get('/rooms/:roomId/activities', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const io = req.app.get('io');
    const collaborationService = (io as any).collaborationService as CollaborationService;
    
    const activities = await collaborationService.getActivities(roomId, limit);
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  }
});

// Create a new collaboration room
router.post('/rooms', authenticate, async (req, res) => {
  try {
    const { subsidyId } = req.body;
    const roomId = `room_${subsidyId}_${Date.now()}`;
    
    res.json({
      success: true,
      data: {
        roomId,
        subsidyId,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room'
    });
  }
});

export default router;