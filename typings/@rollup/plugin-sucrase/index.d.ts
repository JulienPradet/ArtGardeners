declare module "@rollup/plugin-sucrase" {
  import { Plugin } from "rollup";

  type TransformType = "imports" | "typescript";

  export default function (options: {
    transforms: TransformType[];
    exclude?: string[];
  }): Plugin;
}
