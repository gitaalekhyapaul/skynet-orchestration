import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyBotMiddleware } from "../middlewares/telegram.middleware.js";
import { getBotSkynetID, signBotJWT } from "../utils.js";

const router = Router();

const handleGetJWT = async (req: Request, res: Response) => {
  const { botInfo } = res.locals;
  console.log("Bot info:", botInfo);
  if (!botInfo) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }
  const { id } = botInfo;
  console.log("Signing JWT for bot with ID:", id);
  const token = signBotJWT(getBotSkynetID(id));
  console.log("JWT:", token);
  res.status(200).json({
    token,
  });
  return;
};

const handleVerifyJWT = async (req: Request, res: Response) => {
  let token = req.get("Authorization");
  console.log("Verifying JWT...");
  console.log("Token:", token);
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

router.get("/create_token", verifyBotMiddleware, handleGetJWT);
router.get("/user_data", handleVerifyJWT);

export default router;
