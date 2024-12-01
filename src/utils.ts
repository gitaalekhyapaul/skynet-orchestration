import jwt from "jsonwebtoken";

export const signBotJWT = (botId: string) => {
  return jwt.sign({ user_id: botId }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
    issuer: "skynet",
  });
};

export const getBotSkynetID = (botId: number) => `skynet:${botId}`;

export const verifyBotJWT = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
};
