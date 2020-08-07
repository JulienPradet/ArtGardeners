import WebSocket from "ws";

export const createLiveReloadServer = () => {
  let connections = new Set<WebSocket>();

  const wss = new WebSocket.Server({
    port: 8080,
  });
  wss.on("connection", (ws) => {
    connections.add(ws);
    wss.on("close", () => {
      connections.delete(ws);
    });
  });

  return {
    reload: () => {
      connections.forEach((ws) => {
        ws.send("reload");
      });
    },
  };
};
