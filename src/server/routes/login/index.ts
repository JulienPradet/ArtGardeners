import { FastifyPlugin, FastifyPluginOptions } from "fastify";
import fp from "fastify-plugin";
import S from "fluent-schema";
import { getUserFromLogin } from "../../model/user";

const app: FastifyPlugin<FastifyPluginOptions> = (fastify, options, done) => {
  fastify.get("/login", (request, reply) => {
    reply.view("/login.svelte", {
      user: request.user,
    });
  });

  type LoginBody = {
    email: string;
    password: string;
  };

  fastify.post(
    "/login",
    {
      attachValidation: true,
      schema: {
        body: S.object()
          .prop("email", S.string().format("email").required())
          .prop("password", S.string().required()),
      },
    },
    async (request, reply) => {
      // @ts-expect-error: We've got attachValidation above, so there will be a validationError in request
      console.log(request.validationError);

      const { email, password } = request.body as LoginBody;

      const user = await getUserFromLogin(fastify.prisma, { email, password });

      if (user) {
        await reply.setUser(user.id);
        reply.redirect(302, "/");
      } else {
        reply.view("/login.svelte", {});
      }
    }
  );

  done();
};

export default app;
