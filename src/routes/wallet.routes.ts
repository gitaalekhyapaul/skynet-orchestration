import { Router, Request, Response } from "express";
import { verifyBotMiddleware } from "../middlewares/telegram.middleware.js";
import { getBotSkynetID, signBotJWT } from "../utils.js";
import { default as axios, AxiosResponse, isAxiosError } from "axios";
import {
  AnyType,
  OktoCreateWalletResponse,
  OktoJWTAuthResponse,
  OktoResponse,
} from "../types.js";

const router = Router();

const handleGetAddress = async (req: Request, res: Response) => {
  const { id } = res.locals.botInfo!;
  console.log("Getting address for bot with ID:", id);
  const jwt = signBotJWT(getBotSkynetID(id));
  console.log("Signing JWT for bot with ID:", id);
  console.log("JWT:", jwt);
  try {
    console.log("Authenticating with Okto API...");
    const { data: data_1 } = await axios.post<
      AnyType,
      AxiosResponse<OktoJWTAuthResponse>
    >(`${process.env.OKTO_API_BASE_URL}/api/v1/authenticate/jwt`, undefined, {
      headers: {
        "x-api-key": process.env.OKTO_API_SECRET,
        Authorization: `Bearer ${jwt}`,
      },
    });
    console.log("Authenticated with Okto API");
    console.dir(data_1, { depth: null });
    const { auth_token } = data_1.data;
    console.log("Bot auth token from Okto:", auth_token);
    const { data: data_2 } = await axios.post<
      OktoResponse<OktoCreateWalletResponse>
    >(`${process.env.OKTO_API_BASE_URL}/api/v1/wallet`, undefined, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
    });
    console.log("Wallets created on Okto:");
    console.dir(data_2, { depth: null });
    res.status(200).json(data_2);
    return;
  } catch (err: AnyType) {
    if (isAxiosError(err)) {
      res.status(err.response?.status || 500).json(err.toJSON());
    } else {
      res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
      });
    }
    return;
  }
};

router.get("/address", verifyBotMiddleware, handleGetAddress);

export default router;
