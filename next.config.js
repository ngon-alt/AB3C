/** @type {import('next').NextConfig} */
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
        destination: 'https://analyzer.ab3c.jp/:path*',
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
