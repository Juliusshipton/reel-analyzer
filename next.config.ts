import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load ffmpeg-static with native require so its binary path resolves correctly.
  serverExternalPackages: ["ffmpeg-static"],
};

export default nextConfig;
