// extension.js
(function (Scratch) {
    'use strict';

    class SocketGGExtension {
        constructor() {
            this.socket = null;
            this.currentMessage = null;
            this.allMessages = [];
            this.currentData = null;
            this.currentStreamData = null;
            this.userId = 'defaultUser';
            this.isConnected = false;
            this.currentRoom = null;
            this.messageEventListeners = [];
            this.privateMessageEventListeners = [];
            this.fileTransferDataEventListeners = [];
            this.streamDataEventListeners = [];
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
                                defaultValue: 'http://localhost:2415'
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
                        opcode: 'sendPrivateMessage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'send private message [MESSAGE] to user [USER_ID]',
                        arguments: {
                            MESSAGE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Hello, private user!'
                            },
                            USER_ID: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'otherUser'
                            }
                        }
                    },
                    {
                        opcode: 'requestFileTransferInRoom',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'send file [FILE_CONTENT_BASE64] in current room',
                        arguments: {
                            FILE_CONTENT_BASE64: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'your_base64_encoded_file_content'
                            }
                        }
                    },
                    {
                        opcode: 'requestFileTransferToUser',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'send file [FILE_CONTENT_BASE64] to user [USER_ID]',
                        arguments: {
                            FILE_CONTENT_BASE64: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'your_base64_encoded_file_content'
                            },
                            USER_ID: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'otherUser'
                            }
                        }
                    },
                    {
                        opcode: 'sendStreamData',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'stream data [DATA] in current room',
                        arguments: {
                            DATA: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'your_stream_data'
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
                        opcode: 'getCurrentStreamData',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'get current stream data'
                    },
                    {
                        opcode: 'whenMessageReceivedInCurrentRoom',
                        blockType: Scratch.BlockType.HAT,
                        text: 'when message received in current room'
                    },
                    {
                        opcode: 'whenPrivateMessageReceived',
                        blockType: Scratch.BlockType.HAT,
                        text: 'when private message received'
                    },
                    {
                        opcode: 'whenFileTransferDataReceived',
                        blockType: Scratch.BlockType.HAT,
                        text: 'when file transfer data received'
                    },
                    {
                        opcode: 'whenStreamDataReceived',
                        blockType: Scratch.BlockType.HAT,
                        text: 'when stream data received'
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
                        console.log('Received message from server:', data);
                        this.currentMessage = data;
                        this.allMessages.push(data);
                        this.triggerMessageEvent(data);
                    }
                });

                this.socket.on('privateMessage', (data) => {
                    console.log('Received private message from server:', data);
                    this.triggerPrivateMessageEvent(data);
                });

                this.socket.on('fileTransferData', (data) => {
                    console.log('File transfer data received from server:', data);
                    this.currentData = data.data;
                    this.triggerFileTransferDataEvent(data);
                });

                this.socket.on('streamData', (data) => {
                    console.log('Stream data received from server:', data);
                    this.currentStreamData = data.data;
                    this.triggerStreamDataEvent(data);
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

        sendPrivateMessage(args) {
            if (this.isConnected) {
                this.socket.emit('privateMessage', { fromUserId: this.userId, toUserId: args.USER_ID, message: args.MESSAGE });
            } else {
                alert('Not connected to signaling server');
            }
        }

        requestFileTransferInRoom(args) {
            if (this.isConnected && this.currentRoom) {
                this.socket.emit('fileTransfer', { fromUserId: this.userId, toUserId: '*', data: args.FILE_CONTENT_BASE64, room: this.currentRoom });
            } else {
                alert('Not connected to signaling server or not in a room');
            }
        }

        requestFileTransferToUser(args) {
            if (this.isConnected) {
                this.socket.emit('fileTransfer', { fromUserId: this.userId, toUserId: args.USER_ID, data: args.FILE_CONTENT_BASE64 });
            } else {
                alert('Not connected to signaling server');
            }
        }

        sendStreamData(args) {
            if (this.isConnected && this.currentRoom) {
                this.socket.emit('streamData', { fromUserId: this.userId, data: args.DATA, room: this.currentRoom });
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

        getCurrentStreamData() {
            return this.currentStreamData || '';
        }

        whenMessageReceivedInCurrentRoom() {
            return {};
        }

        whenPrivateMessageReceived() {
            return {};
        }

        whenFileTransferDataReceived() {
            return {};
        }

        whenStreamDataReceived() {
            return {};
        }

        triggerMessageEvent(data) {
            this.messageEventListeners.forEach(listener => listener(data));
        }

        triggerPrivateMessageEvent(data) {
            this.privateMessageEventListeners.forEach(listener => listener(data));
        }

        triggerFileTransferDataEvent(data) {
            this.fileTransferDataEventListeners.forEach(listener => listener(data));
        }

        triggerStreamDataEvent(data) {
            this.streamDataEventListeners.forEach(listener => listener(data));
        }

        handleMessageEvent(hat) {
            this.messageEventListeners.push(hat);
        }

        handlePrivateMessageEvent(hat) {
            this.privateMessageEventListeners.push(hat);
        }

        handleFileTransferDataEvent(hat) {
            this.fileTransferDataEventListeners.push(hat);
        }

        handleStreamDataEvent(hat) {
            this.streamDataEventListeners.push(hat);
        }
    }

    Scratch.extensions.register(new SocketGGExtension());
})(Scratch);
