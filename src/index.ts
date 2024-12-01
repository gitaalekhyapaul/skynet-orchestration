import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { BaseService } from "./services/base.service.js";
import { NgrokService } from "./services/ngrok.service.js";
import oktoRoutes from "./routes/okto.routes.js";
import HttpError from "http-errors";
import { AnyType } from "./types.js";

dotenv.config();

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use("/api/v1/jwt", oktoRoutes);

app.get("/health-check", (req: Request, res: Response) => {
  res.status(200).json({ message: "OK", timestamp: new Date().toISOString() });
});

app.use((err: AnyType, req: Request, res: Response, next: NextFunction) => {
  if (HttpError.isHttpError(err)) {
    res.status(err.status).json({
      message: err.message,
    });
    return;
  }
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

const services: BaseService[] = [NgrokService.getInstance<NgrokService>()];

app.listen(process.env.PORT || 3000, async () => {
  await Promise.all(services.map((service) => service.start()));
  const ngrokService = NgrokService.getInstance<NgrokService>();
  const url = await ngrokService.getURL();
  console.log(`Server is running on Port: ${process.env.PORT}`);
  console.log(`Ngrok URL: ${url}`);
});
