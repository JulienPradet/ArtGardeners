import sucrase from "@rollup/plugin-sucrase";
import pkg from "./package.json";

const external = Object.keys(pkg.dependencies).concat(
  Object.keys(process.binding("natives"))
);

const options = {
  input: "src/server/index.ts",
  output: {
    dir: "dist/server",
    format: "esm",
    sourcemap: true,
    chunkFileNames: "[name].js",
  },
  external,
  plugins: [
    sucrase({
      exclude: ["node_modules/**"],
      transforms: ["typescript"],
    }),
  ],
};

export default options;
