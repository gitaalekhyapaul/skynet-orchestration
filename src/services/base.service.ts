import { AnyType } from "../types";

export abstract class BaseService {
  private static instance: BaseService;
  protected isRunning = false;

  protected constructor() {}

  static getInstance<T extends BaseService>(): T {
    if (!this.instance) {
      this.instance = new (this as AnyType)();
    }
    return this.instance as T;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
  }
}
