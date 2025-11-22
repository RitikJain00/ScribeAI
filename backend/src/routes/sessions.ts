import express from 'express';
import { prisma } from '../lib/prisma';
import { verifyUser, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Fetch all transcripts for user
router.get("/", verifyUser, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  try {
    const transcripts = await prisma.transcript.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true,  createdAt: true },
    });
    res.json(transcripts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

// Fetch single transcript with optional summary
router.get("/:id", verifyUser, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const transcript = await prisma.transcript.findUnique({
      where: { id },
      include: { summary: true },
    });

    if (!transcript || transcript.userId !== userId) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    res.json(transcript);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
});

// Generate/fetch summary
router.post("/:id/summary", verifyUser, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const transcript = await prisma.transcript.findUnique({
      where: { id },
      include: { summary: true },
    });

    if (!transcript || transcript.userId !== userId) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    // If summary exists, return it
    if (transcript.summary) {
      return res.json({ summary: transcript.summary.text });
    }

    // Otherwise generate summary (pseudo Gemini API call)
    const generatedSummary = `Summary for transcript "${transcript.title}"...`; // Replace with Gemini API call

    const newSummary = await prisma.summary.create({
      data: {
        userId,
        transcriptId: transcript.id,
        text: generatedSummary,
      },
    });

    res.json({ summary: newSummary.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate/fetch summary" });
  }
});

export default router;
