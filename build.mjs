import fs from 'fs/promises';
import path from 'path';
// FIX: Removed explicit `process` import. The `process` object is globally
// available in Node.js, and this change avoids a type definition conflict.
import esbuild from 'esbuild';

const distDir = './dist';

// Define assets to be copied directly
const assetsToCopy = [
    'index.html',
    'assets',
    'google094f0a5dcd31b0ad.html',
    'sitemap.xml',
    'metadata.json'
];

// Define dependencies that are handled by the importmap and should not be bundled
const externalPackages = [
    'firebase/compat/app',
    'firebase/compat/auth',
    'firebase/compat/database',
    'react',
    'react-dom/client',
    'react/jsx-runtime'
];


/**
 * Recursively copies a source file or directory to a destination.
 * @param {string} src - The source path.
 * @param {string} dest - The destination path.
 */
async function copyRecursive(src, dest) {
    try {
        const stats = await fs.stat(src);
        if (stats.isDirectory()) {
            await fs.mkdir(dest, { recursive: true });
            const entries = await fs.readdir(src);
            for (const entry of entries) {
                const srcPath = path.join(src, entry);
                const destPath = path.join(dest, entry);
                await copyRecursive(srcPath, destPath);
            }
        } else {
            await fs.copyFile(src, dest);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore if source doesn't exist
            throw error;
        }
    }
}


/**
 * Main build function to prepare the application for deployment.
 */
async function build() {
    console.log('Starting production build process...');

    try {
        // 1. Clean the distribution directory
        console.log(`Cleaning directory: ${distDir}`);
        await fs.rm(distDir, { recursive: true, force: true });
        await fs.mkdir(distDir, { recursive: true });

        // 2. Bundle JavaScript and TypeScript files
        console.log('Bundling application source code with esbuild...');
        await esbuild.build({
            entryPoints: ['index.tsx'],
            bundle: true,
            outfile: path.join(distDir, 'index.js'),
            format: 'esm',
            jsx: 'automatic',
            loader: { '.tsx': 'tsx', '.ts': 'ts' },
            external: externalPackages,
        });
        console.log('Source code bundled successfully.');

        // 3. Copy static assets
        console.log('Copying static assets...');
        for (const asset of assetsToCopy) {
            const srcPath = path.join('./', asset);
            const destPath = path.join(distDir, asset);
            try {
                await fs.access(srcPath);
                await copyRecursive(srcPath, destPath);
                console.log(`  - Copied ${asset}`);
            } catch {
                console.log(`  - Skipping ${asset} (does not exist)`);
            }
        }
        
        // 4. Update index.html to point to the bundled JS file
        console.log('Updating index.html script reference...');
        const indexPath = path.join(distDir, 'index.html');
        let htmlContent = await fs.readFile(indexPath, 'utf-8');
        htmlContent = htmlContent.replace(
            '<script type="module" src="/index.tsx"></script>',
            '<script type="module" src="/index.js"></script>'
        );
        await fs.writeFile(indexPath, htmlContent, 'utf-8');
        console.log('index.html updated.');

        console.log('\nBuild completed successfully!');
        console.log(`Your deploy-ready application is in the '${distDir}' folder.`);

    } catch (error) {
        console.error('Build process failed:', error);
        process.exit(1); // Exit with an error code
    }
}

// Run the build process
build();