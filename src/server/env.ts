import { resolve } from "path";
import { config } from "dotenv";
import envSchema from "env-schema";
export type AppEnv = {
  PORT: string;
  HOST: string;
  PASSWORD_SALT: string;
  JWT_SECRET: string;
};

config({ path: resolve(__dirname, "../../.env") });

const schema = {
  type: "object",
  required: ["PASSWORD_SALT", "JWT_SECRET"],
  properties: {
    PORT: {
      type: "string",
      default: 4000,
    },
    HOST: {
      type: "string",
      default: "127.0.0.1",
    },
    PASSWORD_SALT: {
      type: "string",
    },
    JWT_SECRET: {
      type: "string",
    },
  },
};

const env: AppEnv = envSchema({
  schema: schema,
}) as AppEnv;

export default env;
