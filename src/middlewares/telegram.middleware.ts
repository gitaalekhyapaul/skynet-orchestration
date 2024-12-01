import { Request, Response, NextFunction, Handler } from "express";
import axios, { AxiosResponse } from "axios";
import { AnyType, TelegramBotResponse } from "../types.js";
import HttpError from "http-errors";

export const verifyBotMiddleware: Handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tgBotToken = req.get("X-TG-BOT-TOKEN");
  if (!tgBotToken) {
    next(new HttpError.BadRequest("Please provide TG bot token"));
    return;
  }
  try {
    console.log("Authenticating the bot token with Telegram API...");
    const { data } = await axios.get<
      AnyType,
      AxiosResponse<TelegramBotResponse>
    >(`https://api.telegram.org/bot${tgBotToken}/getMe`);
    if (!data.ok) {
      next(new HttpError.BadRequest("Unable to authorize from Telegram API"));
      return;
    }
    console.dir(data, { depth: null });
    const { id, username } = data.result;
    res.locals.botInfo = {
      id: id,
      username,
    };
    next();
  } catch (err) {
    next(new HttpError.BadRequest("Unauthorized: Unknown Error"));
  }
};
