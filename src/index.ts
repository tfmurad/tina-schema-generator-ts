#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { select } from '@inquirer/prompts';
import { createRequire } from 'module';
import vm from 'vm';

// Function to fetch and run script from URL
async function fetchAndRunScript(url: string, moduleType: 'CommonJS' | 'ES Modules') {
  try {
    const response = await axios.get(url);
    const scriptContent = response.data;

    console.log('Fetched script content:', scriptContent);

    if (moduleType === 'CommonJS') {
      // CommonJS context setup
      const require = createRequire(__filename);
      const script = new vm.Script(scriptContent);
      const context = vm.createContext({
        require,
        console,
        process,
        exports: {},
        module: { exports: {} },
        __filename: 'script.js',
        __dirname: process.cwd()
      });
      script.runInContext(context);
      console.log('Script output:', context.module.exports);
    } else if (moduleType === 'ES Modules') {
      // Dynamic import of ES Module
      const module = await import(`data:text/javascript;base64,${Buffer.from(scriptContent).toString('base64')}`);
      console.log('ES Module script output:', module);
    }
  } catch (error) {
    console.error('Error fetching or running the script:', error);
  }
}

// Function to set up the package
async function setup() {
  const moduleType = await select({
    message: 'Is your project using CommonJS or ES Modules?',
    choices: [
      { name: 'CommonJS', value: 'CommonJS' },
      { name: 'ES Modules', value: 'ES Modules' },
    ],
  });

  const scriptUrl =
    moduleType === 'CommonJS'
      ? 'https://raw.githubusercontent.com/tfmurad/tina-schema-generator-ts/main/dist/scripts/generate-tina-schema.cjs'
      : 'https://raw.githubusercontent.com/tfmurad/tina-schema-generator-ts/main/dist/scripts/generate-tina-schema.mjs';

  await fetchAndRunScript(scriptUrl, moduleType as 'CommonJS' | 'ES Modules');
}

// Path to check the 'tina' folder in the project root
const projectRoot = process.cwd();
const tinaFolderPath = path.join(projectRoot, 'tina');

// Check if the 'tina' folder exists
fs.access(tinaFolderPath, fs.constants.F_OK, (err) => {
  if (!err) {
    setup();
  } else {
    console.log(
      'The "tina" folder does not exist. Please visit the following link to install the Tina package first:'
    );
    console.log('https://docs.astro.build/en/guides/cms/tina-cms');
  }
});
