import d from "debug";
import { rollup as rollupBuild, OutputOptions } from "rollup";
import { terser } from "rollup-plugin-terser";
import brotli from "rollup-plugin-brotli";
import gzip from "rollup-plugin-gzip";
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

  try {
    await Promise.all([
      (async () => {
        const options = await serverOptions();
        const serverBundle = await rollupBuild(options);
        await serverBundle.write(options.output as OutputOptions);
      })(),
      ...locales.map(async (locale) => {
        const templatesOptionsForLocale = await templatesOptions(locale);
        const templatesBundle = await rollupBuild(templatesOptionsForLocale);
        await templatesBundle.write(
          templatesOptionsForLocale.output as OutputOptions
        );

        const componentsOptionsForLocale = await componentsOptions(locale);
        const componentsBundle = await rollupBuild(componentsOptionsForLocale);
        await componentsBundle.write({
          ...(componentsOptionsForLocale.output as OutputOptions),
          plugins: [terser(), brotli({}), gzip({})],
        });
      }),
    ]);

    console.log("All compilations OK. Yay!");
    process.exit(0);
  } catch (e) {
    console.error(e);
  }
};

run();
