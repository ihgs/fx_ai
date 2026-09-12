export type UsdJpyRate = {
  symbol: "USD_JPY";
  bid: number;
  ask: number;
  timestamp: string;
  /** 直近取引日の始値。取得できなかった場合は null。 */
  open: { price: number; date: string } | null;
};
