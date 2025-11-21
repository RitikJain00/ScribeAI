import { Server, Socket } from "socket.io";
import fs from "fs";
import path from "path";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

export const createSocketServer = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // ==============================
    // Deepgram Live Connection
    // ==============================
    const deepgramLive = deepgram.listen.live({
      model: "nova-2-general",
      punctuate: true,
    });

    deepgramLive.on(LiveTranscriptionEvents.Open, () => {
      console.log("[Deepgram] Connection opened");
    });

    deepgramLive.on(LiveTranscriptionEvents.Error, (err) => {
      console.error("[Deepgram] ERROR:", err);
    });

    deepgramLive.on(LiveTranscriptionEvents.Close, () => {
      console.log("[Deepgram] Connection closed");
    });

    // When transcript arrives
    deepgramLive.on(LiveTranscriptionEvents.Transcript, (response: any) => {
      try {
        const transcript = response.channel.alternatives[0]?.transcript;

        if (transcript && transcript.trim() !== "") {
          socket.emit("transcript", transcript);
        }
      } catch (err) {
        console.error("Deepgram parse error:", err);
      }
    });

    // ==============================
    // Receive Audio From Frontend
    // ==============================
    socket.on("audio-chunk", async (blob: ArrayBuffer) => {
      try {
        // Convert Node Buffer → ArrayBuffer
        const buffer = Buffer.from(blob);

        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );

        // Send audio to Deepgram
        deepgramLive.send(arrayBuffer);

        // Optional: SAVE chunk in uploads/
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

        const filePath = path.join(
          uploadsDir,
          `chunk-${Date.now()}-${socket.id}.webm`
        );

        fs.writeFileSync(filePath, buffer);

      } catch (error) {
        console.error("Error processing audio chunk:", error);
      }
    });

    // ==============================
    // Client Disconnect
    // ==============================
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      deepgramLive.finish(); // Required!
    });
  });

  return io;
};
