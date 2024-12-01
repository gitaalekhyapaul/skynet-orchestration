import { Request, Response, NextFunction, Handler } from "express";
import axios, { AxiosResponse } from "axios";
import { AnyType, TelegramBotResponse } from "../types.js";
import HttpErrors from "http-errors";

export const telegramMiddleware: Handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tgBotToken = req.get("X-TG-BOT-TOKEN");
  console.log("Testing bot token in middleware: %s", tgBotToken);
  if (!tgBotToken) {
    next(new HttpErrors.BadRequest("Unauthorized"));
  }
  try {
    const { data } = await axios.get<
      AnyType,
      AxiosResponse<TelegramBotResponse>
    >(`https://api.telegram.org/bot${tgBotToken}/getMe`);
    if (!data.ok) {
      next(new HttpErrors.BadRequest("Unauthorized"));
    }
    const { id, username } = data.result;
    res.locals.botInfo = {
      id: id,
      username,
    };
    next();
  } catch (err) {
    next(new HttpErrors.BadRequest("Unauthorized"));
  }
  next();
};
