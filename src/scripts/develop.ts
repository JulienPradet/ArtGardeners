import d from "debug";
import { spawn } from "cross-spawn";
import { RollupOptions, watch as rollupWatch, SourceDescription } from "rollup";
import outputManifest from "rollup-plugin-output-manifest";
import sucrase from "@rollup/plugin-sucrase";
import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import { readFile } from "fs";
import WebSocket from "ws";
import rollupIntlPlugin from "../tooling/intl/rollupIntlPlugin";
import { join } from "path";

process.env.NODE_ENV = "development";

declare module "rollup-plugin-svelte" {
  interface Options {
    generate?: string | false;
  }
}

const debug = d("artgardeners:cli:develop");

const readJson = async (path: string): Promise<object> => {
  return new Promise((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(JSON.parse(data.toString()));
    });
  });
};

type ServerProcessManager = {
  close: () => Promise<number>;
};
const startServerProcess = (
  path: string,
  onMessage: (message: { type?: string; payload?: {} }) => void = () => {}
): ServerProcessManager => {
  const proc = spawn("node", [path], {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  proc.on("close", (code, signal) => {
    debug(`Server closed with code ${code} signal ${signal}`);
  });
  proc.on("error", (err) => {
    console.error(`An error occured when running the server`);
    console.error(err);
  });
  proc.on("message", function (msg: string) {
    const action = JSON.parse(msg);
    onMessage(action);
  });

  const close = (): Promise<number> => {
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

const createLiveReloadServer = () => {
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

const run = async () => {
  const pkg = (await readJson("package.json")) as any;

  const natives = (process as any).binding("natives") as object;
  const external: string[] = Object.keys(pkg.dependencies)
    .concat(Object.keys(pkg.devDependencies))
    .concat(Object.keys(natives));

  const locales = ["en-GB", "fr-FR"];

  const templatesOptions = (locale: string): RollupOptions => ({
    input: [
      "src/server/view/pages/index.svelte",
      "src/server/view/pages/404.svelte",
      "src/server/view/pages/login.svelte",
    ],
    output: {
      dir: `dist/server/view/pages/${locale}`,
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    external: [...external, "svelte/internal"],
    plugins: [
      svelte({
        generate: "ssr",
      }),
      rollupIntlPlugin(locale, join(__dirname, "../translations")),
      resolve({
        extensions: [".mjs", ".js"],
      }),
    ],
  });

  const serverOptions: RollupOptions = {
    input: "src/server/index.ts",
    output: {
      dir: "dist/server",
      format: "cjs",
      sourcemap: true,
      chunkFileNames: "[name].js",
    },
    external,
    plugins: [
      sucrase({
        exclude: ["node_modules/**"],
        transforms: ["typescript"],
      }),
      outputManifest({
        fileName: "./manifest.json",
        nameSuffix: ".js",
        filter: (chunk) => true,
        generate: (keyValueDecorator, seed) => {
          return (chunks) => {
            return Object.values(chunks).map((chunk) => chunk.fileName);
          };
        },
      }),
    ],
  };

  const liveReloadServer = createLiveReloadServer();
  let serverProcess: ServerProcessManager;
  let compilationDone = new Map();
  let firstLaunchDone = false;
  let serverClosePromise = Promise.resolve(0);

  const startServer = () => {
    if (
      (!compilationDone.has("server") && compilationDone.get("server")) ||
      !locales.every(
        (locale) => compilationDone.has(locale) && compilationDone.get(locale)
      )
    ) {
      return Promise.resolve();
    }

    return serverClosePromise.then(() => {
      return new Promise((resolve, reject) => {
        firstLaunchDone = true;
        debug(`Starting server`);
        const serverPath = require.resolve("../../dist/server/index.js");
        serverProcess = startServerProcess(serverPath, (message) => {
          debug(`Server listening successfully`);
          if (message.type === "ready") {
            liveReloadServer.reload();
          }
          resolve();
        });
      });
    });
  };

  try {
    const serverWatcher = await rollupWatch(serverOptions);
    serverWatcher.on("event", (event) => {
      switch (event.code) {
        case "START":
          compilationDone.set("server", false);
          if (firstLaunchDone) {
            console.log("Template change detected...");
          }
          if (serverProcess) {
            serverClosePromise = serverProcess.close();
          }
          break;
        case "END":
          compilationDone.set("server", true);
          debug(`Server compilation OK. Waiting for previous server to close.`);
          startServer();
          break;
        case "ERROR":
          console.error(event);
          break;
      }
    });

    await Promise.all(
      locales.map(async (locale) => {
        const options = templatesOptions(locale);
        const templatesWatcher = await rollupWatch(options);

        templatesWatcher.on("event", (event) => {
          switch (event.code) {
            case "START":
              compilationDone.set(locale, false);
              if (firstLaunchDone) {
                console.log("Template change detected...");
              }
              if (serverProcess) {
                serverClosePromise = serverProcess.close();
              }
              break;
            case "END":
              compilationDone.set(locale, true);
              debug(
                `Templates compilation OK. Waiting for previous server to close.`
              );
              startServer();
              break;
            case "ERROR":
              console.error(event);
              break;
          }
        });
      })
    );
  } catch (e) {
    console.error(e);
  }
};

run();
