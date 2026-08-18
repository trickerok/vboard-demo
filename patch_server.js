import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const ioTarget = `    // Handle incoming drawing objects or state updates
    socket.on("canvas_event", ({ roomId, event }) => {
      // Broadcast to others in the room
      socket.to(roomId).emit("canvas_event", event);
    });`;

const ioReplace = `    // Handle incoming drawing objects or state updates
    socket.on("canvas_event", ({ roomId, event }) => {
      socket.to(roomId).emit("canvas_event", event);
    });

    socket.on("cursor_move", ({ roomId, userId, name, x, y, color }) => {
      socket.to(roomId).emit("cursor_update", { userId, name, x, y, color });
    });`;

code = code.replace(ioTarget, ioReplace);
fs.writeFileSync('server.ts', code);
