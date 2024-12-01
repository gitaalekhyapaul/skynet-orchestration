import { AxiosResponse } from "axios";

export type AnyType = any;
export type TelegramBotResponse = {
  ok: boolean;
  result: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
    can_connect_to_business: boolean;
    has_main_web_app: boolean;
  };
};

export type OktoJWTAuthResponse = {
  status: "success" | "failure";
  data: {
    auth_token: string;
    message: string;
    refresh_auth_token: string;
    device_token: string;
  };
};

export type OktoCreateWalletResponse = {
  status: "success" | "failure";
  data: {
    wallets: {
      network_name: string;
      address: string;
      success: boolean;
    }[];
  };
};

export type OktoResponse<T> = [AnyType, AxiosResponse<T>];

export type OktoExecuteTxRequest = {
  network_name: "POLYGON_TESTNET_AMOY";
  transaction: {
    from: string;
    to: string;
    data: string;
    value: string;
  };
};

export type OktoExecuteTxResponse = {
  status: "success" | "failure";
  data: {
    orderId: string;
  };
};

export type OktoExecuteTxStatusResponse = {
  status: "success" | "failure";
  data: {
    jobs: {
      order_id: string;
      network_name: string;
      status: "RUNNING" | "PUBLISHED" | "FAILURE";
      transaction_hash: string;
    }[];
  };
};
