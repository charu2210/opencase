/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow fetching from localhost backend in dev
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
