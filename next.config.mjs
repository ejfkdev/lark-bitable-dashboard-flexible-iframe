import semi from '@douyinfe/semi-next'
/** @type {import('next').NextConfig} */
const nextConfig = {
    ...semi.default(),
    assetPrefix: './',
    output: "export",
};

export default nextConfig;
