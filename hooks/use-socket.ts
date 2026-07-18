"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function useSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(socketInstance);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socketInstance) {
      // Connect to the same origin where the server is running
      socketInstance = io({
        path: "/socket.io",
      });
    }

    setSocket(socketInstance);

    function onConnect() {
      setIsConnected(true);
      if (userId && socketInstance) {
        socketInstance.emit("join_user", userId);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    if (socketInstance.connected) {
      onConnect();
    }

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    return () => {
      if (socketInstance) {
        socketInstance.off("connect", onConnect);
        socketInstance.off("disconnect", onDisconnect);
      }
    };
  }, [userId]);

  return { socket, isConnected };
}
