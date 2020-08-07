import { FastifyPlugin, FastifyPluginOptions } from "fastify";
import login from "./login";

const app: FastifyPlugin<FastifyPluginOptions> = (
  fastify,
  { prefix, ...options },
  done
) => {
  fastify.register(login, options);

  fastify.get("/", (request, reply) => {
    reply.view("/index.svelte", {
      user: request.user,
    });
  });
  fastify.setNotFoundHandler((request, reply) => {
    reply.view("/404.svelte", {
      user: request.user,
    });
  });

  done();
};

export default app;
