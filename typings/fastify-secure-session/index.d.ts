declare module "fastify-secure-session" {
  import * as http from "http";
  import { FastifyCookieOptions } from "fastify-cookie";

  export interface FastifySecureSessionOptions {
    key: string;
    cookie?: FastifyCookieOptions;
  }

  function fastifySecureSession(): void;

  export default fastifySecureSession;
}
