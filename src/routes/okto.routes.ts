import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { telegramMiddleware } from "../middlewares/telegram.middleware.js";

const router = Router();

const handleGetJWT = async (req: Request, res: Response) => {
  const { botInfo } = res.locals;
  if (!botInfo) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }
  const { id } = botInfo;
  const token = jwt.sign({ user_id: id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
    issuer: "skynet",
  });
  res.status(200).json({
    token,
  });
  return;
};

const handleVerifyJWT = async (req: Request, res: Response) => {
  let token = req.get("Authorization");
  if (token == null) {
    res.status(403).json({
      message: "Please pass JWT in Authorization header",
    });
    return;
  }
  token = token.replace(/^Bearer\s/, "");
  const decoded: jwt.JwtPayload = jwt.verify(
    token,
    process.env.JWT_SECRET!
  ) as jwt.JwtPayload;
  res.status(200).json({
    user_id: String(decoded.user_id),
    success: true,
  });
};

router.get("/create_token", telegramMiddleware, handleGetJWT);
router.get("/user_data", handleVerifyJWT);

export default router;
