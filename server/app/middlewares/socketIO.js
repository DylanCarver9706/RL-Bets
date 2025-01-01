// server/app/middlewares/socketIO.js
let ioInstance = null;

const initializeSocketIo = async (io) => {
  ioInstance = io; // Store the io instance
  io.on("connection", async (socket) => {
    console.log("New client connected");

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
  console.log("Socket.io initialized")
};

const getSocketIo = () => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized. Call initializeSocketIo first.");
  }
  return ioInstance;
};

module.exports = { initializeSocketIo, getSocketIo };
