declare module "env-schema" {
  export type EnvSchema = {
    type: string;
    required: Array<string>;
    properties: {
      [key: string]: {
        type: string;
        default?: any;
      };
    };
  };

  export default function (options: {
    schema: EnvSchema;
  }): { [key: string]: any };
}
