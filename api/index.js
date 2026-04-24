'use strict';

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://iraqimetalexchange.com';
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? CORS_ORIGIN : '*',
        methods: ['GET', 'POST'],
    },
});

// Middleware for JSON parsing
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Price proxy with short-lived cache to avoid rate-limiting the upstream
const priceCache = {};
const CACHE_TTL = 10000; // 10 seconds

app.get('/api/prices/:symbol', async (req, res) => {
    const { symbol } = req.params;

    try {
        if (priceCache[symbol] && Date.now() - priceCache[symbol].timestamp < CACHE_TTL) {
            return res.json(priceCache[symbol].data);
        }

        const response = await axios.get(`https://api.gold-api.com/price/${symbol}`, {
            timeout: 8000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (response.status === 200 && response.data) {
            priceCache[symbol] = { data: response.data, timestamp: Date.now() };
            return res.json(response.data);
        }

        throw new Error(`External API responded with status: ${response.status}`);
    } catch (error) {
        if (priceCache[symbol]) {
            console.warn(`[Proxy] Using stale cache for ${symbol} due to external error: ${error.message}`);
            return res.json(priceCache[symbol].data);
        }

        console.error(`[Proxy] Error fetching price for ${symbol}:`, error.message);
        return res.status(502).json({
            error: 'Failed to fetch price from external source',
            details: error.message,
        });
    }
});

// Socket.io for real-time negotiations
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('send-offer', (data) => {
        io.to(data.roomId).emit('receive-offer', data);
    });

    socket.on('accept-offer', (data) => {
        io.to(data.roomId).emit('offer-accepted', data);
    });

    socket.on('reject-offer', (data) => {
        io.to(data.roomId).emit('offer-rejected', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
