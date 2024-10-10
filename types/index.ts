/* eslint-disable @typescript-eslint/no-explicit-any */
export type NftMetadata = {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  image: string;
};

export interface ResponseData {
  success: boolean;
  data?: { [key: string]: any };
  message?: string;
}
