import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketIOServer;

export const initializeSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:5173",
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        },
    });

    io.on("connection", (socket: Socket) => {
        console.log(`Client connected to real-time sync: ${socket.id}`);

        // Allow clients to join specific rooms (e.g., department ID rooms)
        socket.on("join_room", (room: string) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): SocketIOServer => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
