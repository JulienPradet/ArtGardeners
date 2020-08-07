import d from "debug";
import { spawn } from "cross-spawn";
import { rejects } from "assert";
import { resolve } from "path";

const debug = d("artgardeners:cli");

export type ServerProcessManager = {
  close: () => Promise<number>;
};
export const startServerProcess = (
  path: string,
  onMessage: (message: { type?: string; payload?: {} }) => void = () => {}
): ServerProcessManager => {
  let hasCrashed = false;
  const proc = spawn("node", [path], {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  proc.on("close", (code, signal) => {
    debug(`Server closed with code ${code} signal ${signal}`);
  });
  proc.on("error", (err) => {
    console.error(`An error occured when running the server`);
    console.error(err);
    hasCrashed = true;
  });
  proc.on("message", function (msg: string) {
    const action = JSON.parse(msg);
    onMessage(action);
  });

  const close = (): Promise<number> => {
    if (hasCrashed) {
      Promise.resolve(1);
    }
    debug("Closing server");
    return new Promise((resolve, reject) => {
      proc.on("close", (code) => {
        resolve(code);
      });
      proc.kill("SIGTERM");
    });
  };

  process.on("SIGINT", (signal) => {
    debug(`Server stopped because main process received ${signal}`);
    close().then((code) => {
      process.exit(code);
    });
  });

  return {
    close: close,
  };
};
