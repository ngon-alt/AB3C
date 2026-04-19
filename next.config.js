/** @type {import('next').NextConfig} */
// Updated: 2025-04-07 to force rebuild
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ab3c-analyzer.vercel.app',
          },
        ],
        destination: 'https://senryaku.ai/:path*',
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
