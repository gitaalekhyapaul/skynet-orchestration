import { Request } from "express";

declare global {
  namespace Express {
    interface Locals {
      botInfo?: {
        id: number;
        username: string;
      };
    }
  }
}
