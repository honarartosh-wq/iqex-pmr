'use strict';

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware for JSON parsing
app.use(express.json());

// Price API Endpoint
app.get('/api/price', (req, res) => {
    // Example price data, this can be modified to retrieve real data
    const priceData = {
        item: 'Example Item',
        price: 100,
        currency: 'USD'
    };
    res.json(priceData);
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
