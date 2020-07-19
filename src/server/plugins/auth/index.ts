import d from "debug";
import env from "../../env";
import jwtPlugin from "fastify-jwt";
import cookiePlugin from "fastify-cookie";
import { FastifyPlugin, FastifyPluginOptions, FastifyReply } from "fastify";
import fp from "fastify-plugin";

const debug = d("artgardeners:auth");

declare module "fastify" {
  interface FastifyReply {
    setUser: (userId: string) => Promise<void>;
  }
}

const COOKIE_NAME = "token";

const prismaPlugin: FastifyPlugin<FastifyPluginOptions> = async (
  fastify,
  options,
  done
) => {
  fastify.register(jwtPlugin, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: COOKIE_NAME,
    },
  });

  fastify.register(cookiePlugin);

  fastify.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (e) {
      debug("User is not authenticated");
    }
  });

  fastify.decorateReply("setUser", async function (
    this: FastifyReply,
    userId: string
  ) {
    const token = await this.jwtSign({
      id: userId,
    });

    this.setCookie(COOKIE_NAME, token, {
      path: "/",
      secure: false, // send cookie over HTTPS only
      httpOnly: true,
      sameSite: true, // alternative CSRF protection
    });
  });

  done();
};

export default fp(prismaPlugin);
