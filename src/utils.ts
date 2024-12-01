import jwt from "jsonwebtoken";
import { AnyType, OktoJWTAuthResponse } from "./types.js";
import axios, { AxiosResponse } from "axios";
import { promisify } from "util";

export const signBotJWT = (botId: string) => {
  return jwt.sign({ user_id: botId }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
    issuer: "skynet",
  });
};

export const getBotSkynetID = (botId: number) => `skynet:${botId}`;

export const verifyBotJWT = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
};

export const botAuthTokenFromOkto = async (id: number) => {
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
    return auth_token;
  } catch (error) {
    console.error("Error authenticating with Okto API:", error);
    throw error;
  }
};

/**
 * Resolve a promise with timeout
 * @param timeoutMs - Timeout in milliseconds
 * @param promise - Promise to be resolved or a function that returns a promise
 * @param failureMessage - Custom error message for timeout
 */
export function resolvePromiseWithTimeout<T>(
  promise: Promise<T> | (() => Promise<T>),
  timeoutMs?: number,
  failureMessage?: string
) {
  if (timeoutMs == null) {
    return typeof promise === "function" ? promise() : promise;
  }
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((resolve, reject) => {
    timeoutHandle = setTimeout(
      () =>
        reject(
          new Error(failureMessage ?? `Timeout in ${timeoutMs} milliseconds`)
        ),
      timeoutMs
    );
  });

  if (typeof promise === "function") {
    promise = promise();
  }
  return Promise.race([promise, timeoutPromise]).then((result) => {
    clearTimeout(timeoutHandle);
    return result;
  });
}

/**
 * Sleep function
 */
export const sleep = promisify(setTimeout);

/**
 * Exponential backoff strategy for retries
 * @param base - Base wait time in milliseconds
 */
export function exponentialBackoff(base: number) {
  return (retries: number) => {
    return base * Math.pow(2, retries);
  };
}

/**
 * Options for retry
 */
export type RetryOptions<T = unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shouldRetry?: (err?: any, data?: T) => boolean;
  waitInMs?: number | ((retries: number) => number);
  maxRetries?: number;
};

/**
 * Run a task with retry it if fails
 * @param fn - Task function
 * @param options - Retry options
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions<T>
) {
  const shouldRetry = options?.shouldRetry ?? ((err, data) => err != null);
  const waitInMs = options?.waitInMs ?? exponentialBackoff(50);
  const maxRetries = options?.maxRetries ?? 5;
  let retries = 0;
  let wait = 0;
  for (;;) {
    try {
      console.log("Trying #%d", retries);
      const result = await fn();
      console.log("Result", result);
      if (!shouldRetry(undefined, result) || retries >= maxRetries) {
        return result;
      }
      // Let's retry
    } catch (err) {
      console.error("Error in retryWithBackoff: %O", err);
      if (retries >= maxRetries) {
        console.error(
          "Maximum number of retries (%d) has been reached",
          retries
        );
        // Max number of retries reached
        throw err;
      }
      if (!shouldRetry(err)) {
        // Let's fail
        console.error("No retry should happen: %O", err);
        throw err;
      }
    }
    if (typeof waitInMs === "function") {
      wait = waitInMs(retries);
    } else {
      wait = waitInMs;
    }
    console.log("Waiting for %d milliseconds before next retry", wait);
    await sleep(wait);
    ++retries;
  }
}
