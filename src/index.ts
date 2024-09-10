#!/usr/bin/env node

import fs from "fs";
import path from "path";
import axios from "axios";
import { select } from "@inquirer/prompts";
import vm from "vm";

// Function to fetch and run script from URL
async function fetchAndRunScript(url: string, moduleType: string) {
  try {
    const response = await axios.get(url);

    if (moduleType === "CommonJS") {
      // CommonJS context setup
      const script = new vm.Script(response.data);
      const context = vm.createContext({
        require,
        console,
        process,
        exports: {},
        module: { exports: {} },
      });
      script.runInContext(context);

      // If the script exports something, you can access it here
      console.log("Script output:", context.module.exports);
    } else if (moduleType === "ES Modules") {
      // Dynamically import ES module
      const blob = new Blob([response.data], { type: "application/javascript" });
      const urlObject = URL.createObjectURL(blob);

      const module = await import(urlObject);
      console.log("ES Module script output:", module);
      
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(urlObject);
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
      ? "https://raw.githubusercontent.com/tfmurad/tina-schema-generator/main/dist/scripts/generate-tina-schema.cjs"
      : "https://raw.githubusercontent.com/tfmurad/tina-schema-generator/main/dist/scripts/generate-tina-schema.mjs";

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
