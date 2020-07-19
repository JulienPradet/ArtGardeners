import env from "./env";
import fastify from "fastify";
import prismaPlugin from "./plugins/prisma";
import authPlugin from "./plugins/auth";
import formBodyPlugin from "fastify-formbody";
import sveltePlugin from "./plugins/svelte";
import routes from "./routes";

const fastifyInstance = fastify({ logger: { level: "info" } });

const locales = ["en-GB", "fr-FR"];

fastifyInstance
  .register(prismaPlugin)
  .register(authPlugin)
  .register(formBodyPlugin)
  .register(sveltePlugin, { locales: locales });

locales.forEach((locale) => {
  fastifyInstance.register(routes, { prefix: "/" + locale });
});

fastifyInstance.setNotFoundHandler((request, reply) => {
  const url = request.raw.url || "";
  reply.redirect(302, `/${locales[0]}${url}`);
  return;
});

const start = async () => {
  try {
    await fastifyInstance.listen(Number(env.PORT), env.HOST);
    if (process.send) {
      process.send(JSON.stringify({ type: "ready" }));
    }
  } catch (err) {
    console.error("Start error");
    fastifyInstance.log.error(err);
    process.exit(1);
  }
};
process.on("SIGINT", async () => {
  await fastifyInstance.close();
  process.exit(0);
});

start();
