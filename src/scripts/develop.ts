import d from "debug";
import { RollupOptions, watch as rollupWatch } from "rollup";
import { createLiveReloadServer } from "../tooling/createLiveReloadServer";
import {
  ServerProcessManager,
  startServerProcess,
} from "../tooling/serverProcess";
import {
  serverOptions,
  templatesOptions,
  componentsOptions,
} from "../tooling/rollupOptions";

process.env.NODE_ENV = "development";

declare module "rollup-plugin-svelte" {
  interface Options {
    generate?: string | false;
    hydratable?: boolean;
  }
}

const debug = d("artgardeners:cli:develop");

const run = async () => {
  const locales = ["en-GB", "fr-FR"];

  const liveReloadServer = createLiveReloadServer();
  let serverProcess: ServerProcessManager;
  let compilationDone = new Map();
  let firstLaunchDone = false;
  let serverClosePromise = Promise.resolve(0);

  const startServer = () => {
    if (
      (!compilationDone.has("server") && compilationDone.get("server")) ||
      !locales.every(
        (locale) =>
          compilationDone.has(`template-${locale}`) &&
          compilationDone.get(`template-${locale}`) &&
          compilationDone.has(`component-${locale}`) &&
          compilationDone.get(`component-${locale}`)
      )
    ) {
      return Promise.resolve();
    }

    console.log("All compilations OK. Waiting for previous server to close.");

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
    const serverWatcher = await rollupWatch(await serverOptions());
    serverWatcher.on("event", (event) => {
      switch (event.code) {
        case "START":
          compilationDone.set("server", false);
          if (firstLaunchDone) {
            console.log("Template change detected...");
          }
          if (serverProcess) {
            serverClosePromise = serverProcess.close().then((code) => {
              serverClosePromise = Promise.resolve(0);
              return code;
            });
          }
          break;
        case "END":
          compilationDone.set("server", true);
          debug(`Server compilation OK.`);
          startServer();
          break;
        case "ERROR":
          console.error(event);
          break;
      }
    });

    await Promise.all(
      locales.map(async (locale) => {
        const templatesWatcher = await rollupWatch(
          await templatesOptions(locale)
        );

        templatesWatcher.on("event", (event) => {
          switch (event.code) {
            case "START":
              compilationDone.set(`template-${locale}`, false);
              if (firstLaunchDone) {
                console.log("Template change detected...");
              }
              if (serverProcess) {
                serverClosePromise = serverProcess.close().then((code) => {
                  serverClosePromise = Promise.resolve(0);
                  return code;
                });
              }
              break;
            case "END":
              compilationDone.set(`template-${locale}`, true);
              debug(`Templates compilation OK.`);
              startServer();
              break;
            case "ERROR":
              console.error(event);
              break;
          }
        });

        const componentsWatcher = await rollupWatch(
          await componentsOptions(locale)
        );
        componentsWatcher.on("event", (event) => {
          switch (event.code) {
            case "START":
              compilationDone.set(`component-${locale}`, false);
              if (firstLaunchDone) {
                console.log("Component change detected...");
              }
              if (serverProcess) {
                serverClosePromise = serverProcess.close().then((code) => {
                  serverClosePromise = Promise.resolve(0);
                  return code;
                });
              }
              break;
            case "END":
              compilationDone.set(`component-${locale}`, true);
              debug(`Components compilation OK.`);
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
