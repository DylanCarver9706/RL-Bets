// client/src/services/socket.js
import { io } from "socket.io-client";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;
const socket = io(BASE_SERVER_URL, {
  transports: ["websocket"]
});

export default socket;
