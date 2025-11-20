"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = (0, express_1.default)();
// Allow JSON bodies
app.use(express_1.default.json({ limit: "10mb" }));
// CORS - allow your frontend origin
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
}));
app.listen(PORT, () => {
    console.log(`Auth API running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map