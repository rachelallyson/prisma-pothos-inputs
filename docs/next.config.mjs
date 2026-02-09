import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/',
  search: { codeblocks: false },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/prisma-pothos-inputs' : ''),
}

export default withNextra(nextConfig)
