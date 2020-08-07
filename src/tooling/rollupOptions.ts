import { join } from "path";
import { RollupOptions } from "rollup";
import outputManifest from "rollup-plugin-output-manifest";
import sucrase from "@rollup/plugin-sucrase";
import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import replace from "@rollup/plugin-replace";
import { readJson } from "./readJson";
import rollupIntlPlugin from "./intl/rollupIntlPlugin";
import { removeTemplatePreprocessor } from "./partialHydration/removeTemplatePreprocessor";
import { addPartialHydrationServerInfoPreprocessor } from "./partialHydration/addPartialHydrationServerInfoPreprocessor";

const mode = process.env.NODE_ENV;

const getExternal = async () => {
  const pkg = (await readJson("package.json")) as any;

  const natives = (process as any).binding("natives") as object;
  const external: string[] = Object.keys(pkg.dependencies)
    .concat(Object.keys(pkg.devDependencies))
    .concat(Object.keys(natives));

  return external;
};

export const componentsOptions = async (
  locale: string
): Promise<RollupOptions> => {
  return {
    input: ["src/client/Counter.svelte"],
    output: {
      dir: `dist/static/${locale}`,
      sourcemap: true,
      format: "esm",
      exports: "named",
    },
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      svelte({
        hydratable: true,
        preprocess: removeTemplatePreprocessor,
      }),
      resolve({
        browser: true,
        extensions: [".mjs", ".js"],
        dedupe: ["svelte"],
      }),
    ],
  };
};

export const templatesOptions = async (
  locale: string
): Promise<RollupOptions> => {
  const external = await getExternal();

  return {
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
      replace({
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      svelte({
        generate: "ssr",
        include: "src/server/view/**/*.svelte",
      }),
      svelte({
        generate: "ssr",
        include: "src/client/**/*.svelte",
        hydratable: true,
        preprocess: addPartialHydrationServerInfoPreprocessor(locale),
      }),
      rollupIntlPlugin(locale, join(__dirname, "../translations")),
      resolve({
        extensions: [".mjs", ".js"],
        dedupe: ["svelte"],
      }),
    ],
  };
};

export const serverOptions = async (): Promise<RollupOptions> => {
  const external = await getExternal();

  return {
    input: "src/server/index.ts",
    output: {
      dir: "dist/server",
      format: "cjs",
      sourcemap: true,
      chunkFileNames: "[name].js",
    },
    external,
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
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
      resolve({
        extensions: [".mjs", ".js"],
        dedupe: ["svelte"],
      }),
    ],
  };
};
