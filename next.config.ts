import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dockerイメージを最小化するため、実行に必要なファイルだけをトレースして
  // .next/standalone に出力する（Req 1.3 / spec 008）。
  output: "standalone",
};

export default nextConfig;
