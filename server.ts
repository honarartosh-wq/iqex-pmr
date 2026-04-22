import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://iraqimetalexchange.com";
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? CORS_ORIGIN : "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = Number(process.env.PORT) || 3000;

  // Socket.io logic for real-time negotiations
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send-offer", (data) => {
      // data: { roomId, offer, senderId }
      io.to(data.roomId).emit("receive-offer", data);
    });

    socket.on("accept-offer", (data) => {
      // data: { roomId, senderId, offer }
      io.to(data.roomId).emit("offer-accepted", data);
    });

    socket.on("reject-offer", (data) => {
      // data: { roomId, senderId }
      io.to(data.roomId).emit("offer-rejected", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Price cache to prevent rate-limiting and noise
  const priceCache: Record<string, { data: any, timestamp: number }> = {};
  const CACHE_TTL = 10000; // 10 seconds

  app.get("/api/prices/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      // Check cache
      if (priceCache[symbol] && (Date.now() - priceCache[symbol].timestamp < CACHE_TTL)) {
        return res.json(priceCache[symbol].data);
      }

      const response = await axios.get(`https://api.gold-api.com/price/${symbol}`, {
        timeout: 8000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status === 200 && response.data) {
        // Update cache
        priceCache[symbol] = {
          data: response.data,
          timestamp: Date.now()
        };
        res.json(response.data);
      } else {
        throw new Error(`External API responded with status: ${response.status}`);
      }
    } catch (error: any) {
      // If we have stale cache, return it on error to avoid breaking the UI
      const { symbol } = req.params;
      if (priceCache[symbol]) {
        console.warn(`[Proxy] Using stale cache for ${symbol} due to external error: ${error.message}`);
        return res.json(priceCache[symbol].data);
      }

      console.error(`[Proxy] Error fetching price for ${req.params.symbol}:`, error.message);
      res.status(502).json({ 
        error: "Failed to fetch price from external source",
        details: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    // Reuse the Express/Socket.io HTTP server for HMR so we don't try to
    // bind a second listener on PORT. Socket.io keeps its own upgrade path,
    // so the two WebSocket clients coexist without conflict.
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
