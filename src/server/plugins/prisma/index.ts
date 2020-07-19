import { PrismaClient } from "@prisma/client";
import { FastifyPlugin, FastifyPluginOptions, FastifyReply } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPlugin<FastifyPluginOptions> = async (
  fastify,
  options,
  done
) => {
  const prisma = new PrismaClient();
  await prisma.connect();

  fastify.decorate("prisma", prisma);

  done();
};

export default fp(prismaPlugin);
