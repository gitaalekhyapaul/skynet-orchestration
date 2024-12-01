import { BaseService } from "./base.service.js";
import { forward, Listener } from "@ngrok/ngrok";

export class NgrokService extends BaseService {
  private listener: Listener | null;
  constructor() {
    super();
    this.listener = null;
  }
  async start() {
    await super.start();
    console.log("Starting NGROK service...");
    this.listener = await forward({
      proto: "http",
      addr: process.env.PORT,
      authtoken_from_env: true,
      domain: "okto-gita.ngrok.app",
    });
  }
  async stop() {
    await super.stop();
    if (this.listener) {
      await this.listener.close();
    }
  }
  async getURL(): Promise<string | null> {
    if (!this.listener) return null;
    return this.listener.url();
  }
}
