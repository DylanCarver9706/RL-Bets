const { getAllWagers } = require("../controllers/wagerController");

const initializeSocketIo = async (io) => {
  io.on("connection", async (socket) => {
    const wagers = await getAllWagers();
    socket.emit("wagersUpdate", wagers);

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

module.exports = { initializeSocketIo };