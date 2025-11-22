import express from 'express';
import { prisma } from '../lib/prisma';
import { verifyUser, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/save', verifyUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, fullText } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const transcript = await prisma.transcript.create({
      data: {
        userId,
        title,
        fullText, // This is valid because your Prisma model has fullText
      },
    });

    return res.status(201).json({ success: true, transcript });
  } catch (error) {
    console.error('Error saving transcript:', error);
    return res.status(500).json({ error: 'Failed to save transcript' });
  }
});

export default router;
