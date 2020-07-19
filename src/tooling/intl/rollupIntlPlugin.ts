import { Plugin, SourceDescription, PluginContext } from "rollup";
import { transform } from "@babel/core";
import { join } from "path";

const babelIntlPlugin = require("./babelIntlPlugin");

declare module "@babel/core" {
  interface BabelFileMetadata {
    usesIntl: boolean;
  }
}

const rollupIntlPlugin = (
  locale: string,
  translationsFolder: string
): Plugin => {
  return {
    name: "intl",
    transform: async function (
      this: PluginContext,
      code,
      id
    ): Promise<SourceDescription> {
      const result = transform(code, {
        filename: id,
        plugins: [
          [
            babelIntlPlugin,
            {
              locale: locale,
              translationsFolder: translationsFolder,
            },
          ],
        ],
      });

      if (result?.metadata?.usesIntl) {
        this.addWatchFile(join(translationsFolder, `${locale}.json`));
      }

      return {
        code: (result && result.code) ?? code,
        map: { mappings: "" },
      };
    },
  };
};

export default rollupIntlPlugin;
