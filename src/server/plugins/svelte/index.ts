import {
  FastifyPlugin,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyReply {
    view: (path: string, args: {}) => FastifyReply;
  }
}

type SvelteComponent = {
  svId: string[];
  preload?: (prisma: PrismaClient, request: FastifyRequest) => Promise<{}>;
  default: {
    render: (
      props?: {},
      options?: {}
    ) => {
      html: any;
      css: {
        code: string;
        map: any;
      };
      head: string;
    };
    $$render: (result: any, props: any, bindings: any, slots: any) => any;
  };
};

const SveltePlugin: FastifyPlugin<FastifyPluginOptions> = (
  fastify,
  options,
  done
) => {
  fastify.decorateReply("view", async function (
    this: FastifyReply,
    path: string,
    args: {}
  ): Promise<FastifyReply> {
    const url = this.request.raw.url || "";
    const match = new RegExp(`^/(${options.locales.join("|")})/`, "i").exec(
      url
    );
    const locale = match && match.length > 0 && match[1];

    const templatePath = path.replace(/\.svelte$/, ".js");
    const Component: SvelteComponent = require(join(
      process.cwd(),
      `dist/server/view/pages/${locale}`,
      templatePath
    ));

    const data = Component.preload
      ? await Component.preload(fastify.prisma, this.request)
      : {};

    const { html, head, css } = Component.default.render({
      ...args,
      locale,
      data,
    });

    const regex = /<link rel="svComponent" href="([^"]+)" data-sv-id="([^"]+)" [^>]+>/g;
    let matchComponents: RegExpExecArray | null = null;
    let componentPaths = [];
    while ((matchComponents = regex.exec(head)) !== null) {
      componentPaths.push({
        path: matchComponents[1],
        svId: matchComponents[2],
      });
    }

    const componentsMap = componentPaths.map(({ svId }, index) => {
      return {
        svId: svId,
        componentName: `c${index}`,
      };
    });

    this.header("Content-Type", "text/html; charset=UTF-8").send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          ${head}
          <style>${css.code}</style>
        </head>
        <body>${html}</body>
        <script type="module">
          ${componentPaths
            .map(({ path, svId }, index) => `import c${index} from "${path}"`)
            .join("\n")}

            const componentsMap = {${componentsMap
              .map(
                ({ svId, componentName }) =>
                  `[${JSON.stringify(svId)}]: ${componentName}`
              )
              .join(",")}};
 
              document.querySelectorAll("[data-sv-id]:not(link)").forEach((element) => {
            const Component = componentsMap[element.dataset.svId]
            const c = new Component({target: element, hydrate: true, props: {}})
            
          })
        </script>
        ${
          process.env.NODE_ENV === "development"
            ? `
                <script>
                    const listenLivereload = () => {
                        console.log("Attempting to connect to livereload server");

                        let socket;
                        try {
                            socket = new WebSocket('ws://localhost:8080');
                        } catch (e) {
                            setTimeout(() => listenLivereload(), 1000);
                            return;
                        }

                        // Connection opened
                        socket.addEventListener('open', function (event) {
                            console.log("Connected to livereload server");
                        });
                        socket.addEventListener('close', function (event) {
                            console.error("Disconnected from livereload server");
                            setTimeout(() => listenLivereload(), 1000);
                        });
    
                        // Listen for messages
                        socket.addEventListener('message', function (event) {
                            if (event.data === "reload") {
                                window.location.reload();
                            }
                        });
                    }
                    listenLivereload();
                </script>
            `
            : ""
        }
      </html>
    `);

    return this;
  });

  done();
};

export default fp(SveltePlugin);
