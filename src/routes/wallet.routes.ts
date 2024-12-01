import { Router, Request, Response } from "express";
import { verifyBotMiddleware } from "../middlewares/telegram.middleware.js";
import { botAuthTokenFromOkto, retryWithBackoff } from "../utils.js";
import { default as axios, AxiosResponse, isAxiosError } from "axios";
import {
  AnyType,
  OktoCreateWalletResponse,
  OktoExecuteTxRequest,
  OktoExecuteTxResponse,
  OktoExecuteTxStatusResponse,
  OktoResponse,
} from "../types.js";

import HttpError from "http-errors";

const router = Router();

const handleGetAddress = async (req: Request, res: Response) => {
  const { id } = res.locals.botInfo!;
  try {
    const auth_token = await botAuthTokenFromOkto(id);
    const { data: data_2 } = await axios.post<OktoCreateWalletResponse>(
      `${process.env.OKTO_API_BASE_URL}/api/v1/wallet`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      }
    );
    console.log("Wallets created on Okto:");
    console.dir(data_2, { depth: null });
    res.status(200).json({
      wallets: data_2.data.wallets,
    });
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

const handleExecuteTx = async (req: Request, res: Response) => {
  console.log("Executing transaction...");
  console.dir(req.body, { depth: null });
  const { network_name, transaction } = req.body as OktoExecuteTxRequest;
  if (network_name !== "POLYGON_TESTNET_AMOY") {
    res.status(400).json({ message: "Invalid network name" });
    return;
  }
  const { from, to, data, value } = transaction;
  if (!from || !to || !data || !value) {
    res.status(400).json({ message: "Invalid transaction data" });
    return;
  }
  try {
    const { id } = res.locals.botInfo!;
    const auth_token = await botAuthTokenFromOkto(id);
    const { data: data_2 } = await axios.post<OktoExecuteTxResponse>(
      `${process.env.OKTO_API_BASE_URL}/api/v1/rawtransaction/execute`,
      { network_name, transaction },
      {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      }
    );
    console.log("Transaction executed on Okto:");
    console.dir(data_2, { depth: null });
    const { orderId } = data_2.data;
    const data = await retryWithBackoff<
      OktoExecuteTxStatusResponse["data"]["jobs"][0]
    >(
      async () => {
        const { data: data_3 } = await axios.get<OktoExecuteTxStatusResponse>(
          `${process.env.OKTO_API_BASE_URL}/api/v1/rawtransaction/status?order_id=${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${auth_token}`,
            },
          }
        );
        const { jobs } = data_3.data;
        if (jobs.length === 0) {
          throw new HttpError.BadRequest("No jobs found in TX status response");
        }
        return jobs[0];
      },
      {
        maxRetries: 10,
        shouldRetry: (err, data) => {
          if (err != null) return true; // retry if there's an error
          if (!data || data.status !== "PUBLISHED") return true; // retry if no data or status not SUCCESS
          return false; // don't retry if we have data and status is SUCCESS
        },
      }
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Error executing transaction" });
    return;
  }
};

router.get("/address", verifyBotMiddleware, handleGetAddress);
router.post("/execute-tx", verifyBotMiddleware, handleExecuteTx);

export default router;
