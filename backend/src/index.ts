// src/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";


dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = express();

// Allow JSON bodies
app.use(express.json({ limit: "10mb" }));



// CORS - allow your frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);





app.listen(PORT, () => {
  console.log(`Auth API running on http://localhost:${PORT}`);
});
