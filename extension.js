// extension.js
(function (Scratch) {
    'use strict';

    class SocketGGExtension {
        constructor() {
            this.socket = null;
            this.currentMessage = null;
            this.allMessages = [];
            this.currentData = null;
            this.userId = 'defaultUser';
            this.isConnected = false;
            this.currentRoom = null;
            this.messageEventListeners = [];
            this.dataEventListeners = [];
        }

        getInfo() {
            return {
                id: 'socketggextension',
                name: 'Socket.GG',
                blocks: [
                    {
                        opcode: 'connectToServer',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'connect to server [SERVER_URL]',
                        arguments: {
                            SERVER_URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'http://localhost:3000'
                            }
                        }
                    },
                    {
                        opcode: 'setUserId',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'set user to [USER_ID]',
                        arguments: {
                            USER_ID: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'defaultUser'
                            }
                        }
                    },
                    {
                        opcode: 'joinRoom',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'join room [ROOM]',
                        arguments: {
                            ROOM: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'defaultRoom'
                            }
                        }
                    },
                    {
                        opcode: 'leaveRoom',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'leave room [ROOM]',
                        arguments: {
                            ROOM: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'defaultRoom'
                            }
                        }
                    },
                    {
                        opcode: 'sendMessage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'send message [MESSAGE] to current room',
                        arguments: {
                            MESSAGE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Hello, room!'
                            }
                        }
                    },
                    {
                        opcode: 'sendData',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'send data [DATA] to current room',
                        arguments: {
                            DATA: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Some data'
                            }
                        }
                    },
                    {
                        opcode: 'getCurrentMessage',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'get current message'
                    },
                    {
                        opcode: 'getAllMessages',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'get all messages'
                    },
                    {
                        opcode: 'getCurrentData',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'get current data'
                    },
                    {
                        opcode: 'whenMessageReceivedInCurrentRoom',
                        blockType: Scratch.BlockType.HAT,
                        text: 'when message received in current room'
                    },
                    {
                        opcode: 'whenDataReceivedInCurrentRoom',
                        blockType: Scratch.BlockType.HAT,
                        text: 'when data received in current room'
                    }
                ]
            };
        }

        async connectToServer(args) {
            if (this.isConnected) {
                alert('Already connected to a server.');
                return;
            }

            try {
                await this.loadSocketIo();
                this.socket = io(args.SERVER_URL);

                this.socket.on('connect', () => {
                    alert('Connected to signaling server');
                    this.isConnected = true;
                });

                this.socket.on('message', (data) => {
                    if (data.room === this.currentRoom) {
                        alert('Received message from server: ' + JSON.stringify(data));
                        this.currentMessage = data;
                        this.allMessages.push(data);
                        this.triggerMessageEvent(data);
                    }
                });

                this.socket.on('dataStream', (data) => {
                    if (data.room === this.currentRoom) {
                        alert('Received data stream from server: ' + JSON.stringify(data));
                        this.currentData = data.data;
                        this.triggerDataEvent(data);
                    }
                });

                this.socket.on('disconnect', () => {
                    alert('Disconnected from signaling server');
                    this.isConnected = false;
                    this.socket = null;
                });

                this.socket.on('error', (error) => {
                    alert('Error connecting to server: ' + error.message);
                    this.isConnected = false;
                    this.socket = null;
                });
            } catch (error) {
                alert('Failed to load Socket.IO library: ' + error.message);
            }
        }

        loadSocketIo() {
            return new Promise((resolve, reject) => {
                if (window.io) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://cdn.socket.io/4.4.1/socket.io.min.js';
                script.onload = () => {
                    if (window.io) {
                        resolve();
                    } else {
                        reject(new Error('Socket.IO library not found.'));
                    }
                };
                script.onerror = () => {
                    reject(new Error('Failed to load Socket.IO library.'));
                };
                document.head.appendChild(script);
            });
        }

        setUserId(args) {
            this.userId = args.USER_ID;
        }

        joinRoom(args) {
            if (this.isConnected) {
                this.socket.emit('joinRoom', args.ROOM);
                this.currentRoom = args.ROOM;
            } else {
                alert('Not connected to signaling server');
            }
        }

        leaveRoom(args) {
            if (this.isConnected) {
                this.socket.emit('leaveRoom', args.ROOM);
                if (this.currentRoom === args.ROOM) {
                    this.currentRoom = null;
                }
            } else {
                alert('Not connected to signaling server');
            }
        }

        sendMessage(args) {
            if (this.isConnected && this.currentRoom) {
                this.socket.emit('message', { user: this.userId, message: args.MESSAGE, room: this.currentRoom });
            } else {
                alert('Not connected to signaling server or not in a room');
            }
        }

        sendData(args) {
            if (this.isConnected && this.currentRoom) {
                this.socket.emit('dataStream', { user: this.userId, data: args.DATA, room: this.currentRoom });
            } else {
                alert('Not connected to signaling server or not in a room');
            }
        }

        getCurrentMessage() {
            return this.currentMessage ? JSON.stringify(this.currentMessage) : '';
        }

        getAllMessages() {
            return JSON.stringify(this.allMessages);
        }

        getCurrentData() {
            return this.currentData || '';
        }

        whenMessageReceivedInCurrentRoom() {
            return {};
        }

        whenDataReceivedInCurrentRoom() {
            return {};
        }

        triggerMessageEvent(data) {
            this.messageEventListeners.forEach(listener => listener(data));
        }

        triggerDataEvent(data) {
            this.dataEventListeners.forEach(listener => listener(data));
        }

        handleMessageEvent(hat) {
            this.messageEventListeners.push(hat);
        }

        handleDataEvent(hat) {
            this.dataEventListeners.push(hat);
        }
    }

    Scratch.extensions.register(new SocketGGExtension());
})(Scratch);
