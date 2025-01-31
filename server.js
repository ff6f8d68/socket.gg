// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity; you can restrict this to specific origins if needed
        methods: ['GET', 'POST'],
        credentials: true
    }
});

let messages = {};
let dataStreams = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', (room) => {
        console.log(`User ${socket.id} joined room: ${room}`);
        socket.join(room);
    });

    socket.on('leaveRoom', (room) => {
        console.log(`User ${socket.id} left room: ${room}`);
        socket.leave(room);
    });

    socket.on('message', (data) => {
        console.log('Received message:', data);
        if (!messages[data.room]) {
            messages[data.room] = [];
        }
        messages[data.room].push(data);
        io.to(data.room).emit('message', data);
    });

    socket.on('dataStream', (data) => {
        console.log('Received data stream:', data);
        if (!dataStreams[data.room]) {
            dataStreams[data.room] = [];
        }
        dataStreams[data.room].push(data);
        io.to(data.room).emit('dataStream', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove user from all rooms
        Object.keys(socket.rooms).forEach(room => {
            if (room !== socket.id) {
                console.log(`User ${socket.id} left room: ${room}`);
                socket.leave(room);
            }
        });
    });
});

server.listen(3000, () => {
    console.log('Signaling server is running on port 3000');
});
