import crypto from "crypto";
import env from "../../../../src/server/env";
import { PrismaClient, UserSelect } from "@prisma/client";

type LoginInput = { email: string; password: string };
type UserInput = { email: string; password: string };

const hash = (password: string): Promise<string> =>
  new Promise((resolve, reject) => {
    return crypto.scrypt(password, env.PASSWORD_SALT, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(derivedKey.toString("hex"));
    });
  });

export const getUser = async (
  prisma: PrismaClient,
  id: string,
  select?: UserSelect
) => {
  return await prisma.user.findOne({
    where: { id: id },
    select: select || { id: true, email: true },
  });
};

export const createUser = async (
  prisma: PrismaClient,
  userInput: UserInput
) => {
  return await prisma.user.create({
    data: {
      email: userInput.email,
      passwordHash: await hash(userInput.password),
    },
  });
};

export const getUserFromLogin = async (
  prisma: PrismaClient,
  loginInput: LoginInput,
  select: UserSelect = { id: true }
) => {
  const passwordHash = await hash(loginInput.password);

  const user = await prisma.user.findOne({
    where: {
      email: loginInput.email,
    },
    select: { ...select, passwordHash: true },
  });

  if (user && user.passwordHash === passwordHash) {
    return user;
  } else {
    return null;
  }
};
