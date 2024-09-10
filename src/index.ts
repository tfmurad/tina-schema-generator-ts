#!/usr/bin/env node

import fs from "fs";
import path from "path";
import axios from "axios";
import { select } from "@inquirer/prompts";
import { createRequire } from "module";
import vm from "vm";

// Function to fetch and run script from URL
async function fetchAndRunScript(url: string, moduleType: string) {
  try {
    const response = await axios.get(url);
    const scriptContent = response.data;

    if (moduleType === "CommonJS") {
      // For CommonJS, save to a temporary file and require it
      const tempFilePath = path.join(__dirname, "temp-script.js");
      fs.writeFileSync(tempFilePath, scriptContent);

      const require = createRequire(import.meta.url);
      require(tempFilePath);

      fs.unlinkSync(tempFilePath); // Clean up temporary file
    } else {
      // For ES Modules, use vm
      const script = new vm.Script(scriptContent);
      const context = vm.createContext({ require, console, process });
      script.runInContext(context);
    }
  } catch (error) {
    console.error("Error fetching or running the script:", error);
  }
}

// Function to set up the package
async function setup() {
  const moduleType = await select({
    message: "Is your project using CommonJS or ES Modules?",
    choices: [
      { name: "CommonJS", value: "CommonJS" },
      { name: "ES Modules", value: "ES Modules" },
    ],
  });

  const scriptUrl =
    moduleType === "CommonJS"
      ? "https://raw.githubusercontent.com/tfmurad/tina-schema-generator-ts/main/dist/scripts/generate-tina-schema.cjs"
      : "https://raw.githubusercontent.com/tfmurad/tina-schema-generator-ts/main/dist/scripts/generate-tina-schema.mjs";

  await fetchAndRunScript(scriptUrl, moduleType);
}

// Path to check the 'tina' folder in the project root
const projectRoot = process.cwd();
const tinaFolderPath = path.join(projectRoot, "tina");

// Check if the 'tina' folder exists
fs.access(tinaFolderPath, fs.constants.F_OK, (err: any) => {
  if (!err) {
    setup();
  } else {
    console.log(
      'The "tina" folder does not exist. Please visit the following link to install the Tina package first:'
    );
    console.log("https://docs.astro.build/en/guides/cms/tina-cms");
  }
});
