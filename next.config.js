/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ncgssjjcsqnhujbkozzy.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
