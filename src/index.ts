import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { select } from '@inquirer/prompts';
import vm from 'vm';

async function fetchAndRunScript(url: string, moduleType: any) {
  try {
    const response = await axios.get(url);
    const scriptCode = response.data;
    const context = vm.createContext({ require, console, process });
    
    if (moduleType === 'ES Modules') {
      // Wrap the script in an ES module context
      const esModuleScript = new vm.Script(`
        (async () => {
          ${scriptCode}
        })();
      `);
      esModuleScript.runInContext(context);
    } else {
      // Wrap the script in a CommonJS context
      const commonJSModuleScript = new vm.Script(`
        (function (exports, require, module, __filename, __dirname) {
          ${scriptCode}
        })(
          {},
          require,
          module,
          __filename,
          __dirname
        );
      `);
      commonJSModuleScript.runInContext(context);
    }
  } catch (error) {
    console.error('Error fetching or running the script:', error);
  }
}

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

  await fetchAndRunScript(scriptUrl, moduleType);
}

const projectRoot = process.cwd();
const tinaFolderPath = path.join(projectRoot, 'tina');

fs.access(tinaFolderPath, fs.constants.F_OK, (err) => {
  if (!err) {
    setup();
  } else {
    console.log('The "tina" folder does not exist. Please visit the following link to install the Tina package first:');
    console.log('https://docs.astro.build/en/guides/cms/tina-cms');
  }
});
