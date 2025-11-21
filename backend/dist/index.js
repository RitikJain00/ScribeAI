"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authroutes_1 = __importDefault(require("./routes/authroutes"));
const socket_1 = require("./socket/socket");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize socket server
(0, socket_1.createSocketServer)(server);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// REST Routes
app.use("/api/auth", authroutes_1.default);
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`HTTP server running at http://localhost:${PORT}`);
    console.log(`Socket.io running at ws://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map