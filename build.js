const fs = require('fs-extra');
const path = require('path');

const buildDir = path.join(__dirname, 'dist');
const srcDir = path.join(__dirname, 'src');

async function build() {
  try {
    // Clean up the build directory
    if (fs.existsSync(buildDir)) {
      await fs.remove(buildDir);
    }
    await fs.mkdir(buildDir);

    // Copy source files
    await fs.copy(srcDir, path.join(buildDir, 'src'));

    // Copy package files
    await fs.copy(path.join(__dirname, 'package.json'), path.join(buildDir, 'package.json'));
    await fs.copy(path.join(__dirname, 'package-lock.json'), path.join(buildDir, 'package-lock.json'));

    console.log('Build successful!');
  } catch (err) {
    console.error('Error during build:', err);
    process.exit(1);
  }
}

build();
