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

    // --- Persistent Deepgram Live Connection per client ---
    let deepgramLive = deepgram.listen.live({
      model: "nova-2-general",
      punctuate: true,
    });

    let isDeepgramOpen = false;

    // Notify frontend when ready
    deepgramLive.on(LiveTranscriptionEvents.Open, () => {
      console.log("[Deepgram] Connection opened for", socket.id);
      isDeepgramOpen = true;
      socket.emit("deepgram-ready");
    });

    deepgramLive.on(LiveTranscriptionEvents.Close, () => {
      console.log("[Deepgram] Connection closed for", socket.id);
      isDeepgramOpen = false;
    });

    deepgramLive.on(LiveTranscriptionEvents.Error, (err) => {
      console.error("[Deepgram] ERROR for", socket.id, err);
      isDeepgramOpen = false;
      socket.emit("deepgram-error", err);
    });

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

    // --- Receive audio chunks ---
    socket.on("audio-chunk", async (blob: ArrayBuffer) => {
      try {
        if (!isDeepgramOpen) return; // ignore if Deepgram not ready

        const buffer = Buffer.from(blob);
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );

        deepgramLive.send(arrayBuffer);

        // Optional: save chunk
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

    // --- Client requests reset ---
    socket.on("reset-recording", () => {
      console.log("Reset recording requested by", socket.id);
      // Only frontend resets media recorder / transcript
      // Do NOT close Deepgram connection
    });

    // --- Client disconnect ---
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (deepgramLive && isDeepgramOpen) {
        deepgramLive.finish(); // close only when client leaves
      }
    });
  });

  return io;
};
