/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8000/api/:path*'
          : 'http://backend:8000/api/:path*',
      },
    ]
  },
  env: {
    BACKEND_URL: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000'
      : 'http://backend:8000',
  },
  experimental: {
    forceSwcTransforms: true,
  },
}

module.exports = nextConfig 