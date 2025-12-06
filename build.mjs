import fs from 'fs/promises';
import path from 'path';
// FIX: The `process` object can conflict with browser polyfills that don't have an `exit` method.
// Importing `exit` directly from the native 'node:process' module avoids this ambiguity and resolves the type error.
import { exit } from 'node:process';

const sourceDir = './';
const distDir = './dist';
// Define files and folders to exclude from the final build directory
const itemsToExclude = new Set([
  '.git', 
  'node_modules', 
  'dist', 
  'package.json', 
  'package-lock.json', 
  'build.mjs', 
  '.gitignore'
]);

/**
 * Recursively copies a source file or directory to a destination.
 * @param {string} src - The source path.
 * @param {string} dest - The destination path.
 */
async function copyRecursive(src, dest) {
  try {
    const stats = await fs.stat(src);
    const isDirectory = stats.isDirectory();

    if (isDirectory) {
      // Do not copy excluded directories
      if (itemsToExclude.has(path.basename(src))) {
        return;
      }
      // Create destination directory and copy its contents
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src);
      for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        await copyRecursive(srcPath, destPath);
      }
    } else {
      // Copy file directly
      await fs.copyFile(src, dest);
    }
  } catch (error) {
    // Ignore errors for files that might not exist (e.g., package-lock.json)
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Main build function to prepare the application for deployment.
 */
async function build() {
  console.log('Starting build process...');

  try {
    // 1. Clean the distribution directory
    console.log(`Cleaning directory: ${distDir}`);
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });

    // 2. Copy all necessary files and directories to the dist folder
    console.log(`Copying files from '${sourceDir}' to '${distDir}'`);
    const entries = await fs.readdir(sourceDir);
    for (const entry of entries) {
        if (!itemsToExclude.has(entry)) {
            const srcPath = path.join(sourceDir, entry);
            const destPath = path.join(distDir, entry);
            await copyRecursive(srcPath, destPath);
        }
    }
    
    console.log('\nBuild completed successfully!');
    console.log(`Your deploy-ready application is in the '${distDir}' folder.`);

  } catch (error) {
    console.error('Build process failed:', error);
    // FIX: Call the imported `exit` function directly to ensure the Node.js process is terminated correctly.
    exit(1); // Exit with an error code
  }
}

// Run the build process
build();