import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { BaseService } from "./services/base.service";
import { NgrokService } from "./services/ngrok.service";

dotenv.config();

const app: Express = express();

app.use(cors());

app.get("/health-check", (req: Request, res: Response) => {
  res.status(200).json({ message: "OK", timestamp: new Date().toISOString() });
});

const services: BaseService[] = [NgrokService.getInstance<NgrokService>()];

app.listen(process.env.PORT || 3000, async () => {
  await Promise.all(services.map((service) => service.start()));
  const ngrokService = NgrokService.getInstance<NgrokService>();
  const url = await ngrokService.getURL();
  console.log(`Server is running on port ${process.env.PORT}`);
  console.log(`Ngrok URL: ${url}`);
});
