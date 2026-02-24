/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // ESLint v10 dropped useEslintrc/extensions used by next lint;
        // skip during build until next lint adds flat-config support.
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
