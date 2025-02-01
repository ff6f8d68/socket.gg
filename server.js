// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

let messages = {};
let privateMessages = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', (room) => {
        console.log(`User ${socket.id} joined room: ${room}`);
        socket.join(room);
        socket.currentRoom = room;
        io.to(room).emit('userJoined', { userId: socket.id });
        socket.emit('chatHistory', { room, messages: messages[room] || [] });
    });

    socket.on('leaveRoom', (room) => {
        console.log(`User ${socket.id} left room: ${room}`);
        socket.leave(room);
        delete socket.currentRoom;
        io.to(room).emit('userLeft', { userId: socket.id });
    });

    socket.on('message', (data) => {
        console.log('Received message:', data);
        if (!messages[data.room]) {
            messages[data.room] = [];
        }
        messages[data.room].push(data);
        io.to(data.room).emit('message', data);
    });

    socket.on('privateMessage', (data) => {
        console.log('Received private message:', data);
        io.to(data.toUserId).emit('privateMessage', data);
    });

    socket.on('fileTransfer', (data) => {
        console.log('Received file transfer request:', data);
        io.to(data.room).emit('fileTransferData', data);
    });

    socket.on('streamData', (data) => {
        console.log('Received stream data:', data);
        io.to(data.room).emit('streamData', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.currentRoom) {
            io.to(socket.currentRoom).emit('userLeft', { userId: socket.id });
        }
        Object.keys(socket.rooms).forEach(room => {
            if (room !== socket.id) {
                console.log(`User ${socket.id} left room: ${room}`);
                socket.leave(room);
            }
        });
    });
});

server.listen(2415, () => {
    console.log('Signaling server is running on port 2415');
});
