import { PreprocessOptions } from "rollup-plugin-svelte";
import { join } from "path";

export const addPartialHydrationServerInfoPreprocessor = (
  locale: string
): PreprocessOptions => ({
  markup: async ({ content, filename }) => {
    let componentTag;
    const svId = filename
      .replace(join(process.cwd(), "src/client"), "")
      .replace(/\.svelte$/, ".js");

    let code = content
      .replace(/<template tag="([^"]+)"/, (string: string, tag: string) => {
        componentTag = tag || "div";
        return `
              <svelte:head>
                <link rel="preload" href="/${locale}${svId}">
                <link rel="svComponent" href="/${locale}${svId}" data-sv-id="${svId}">
              </svelte:head>
              <${componentTag} data-sv-id="${svId}"
            `;
      })
      .replace("</template>", `</${componentTag}>`);

    const exportSvId = `export const svId = ${JSON.stringify(svId)};`;
    if (/<script context="module">/.test(code)) {
      code = code.replace(
        /<script context="module">/,
        (tag: string) => tag + exportSvId
      );
    } else {
      code = `<script context="module">${exportSvId}</script>${code}`;
    }

    return {
      code: code,
      dependencies: componentTag ? [] : undefined,
    };
  },
});
