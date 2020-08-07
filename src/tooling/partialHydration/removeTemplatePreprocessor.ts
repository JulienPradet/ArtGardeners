import { PreprocessOptions } from "rollup-plugin-svelte";

export const removeTemplatePreprocessor: PreprocessOptions = {
  markup: async ({ content, filename }) => {
    let code = content
      .replace(/<template tag="([^"]+)"( [^>])?>/, "")
      .replace("</template>", ``);

    return {
      code: code,
    };
  },
};
