#!/usr/bin/env node

import fs from "fs";
import path from "path";
import axios from "axios";
import { select } from "@inquirer/prompts";

// Type definitions
type ModuleType = "CommonJS" | "ES Modules";

// Function to fetch and run CommonJS script
async function fetchAndRunCjsScript(url: string): Promise<void> {
  try {
    console.log(`Fetching script from URL: ${url}`);
    const response = await axios.get(url);
    const scriptContent = response.data as string;
    console.log("Script content fetched successfully.");

    // Create a new VM context with CommonJS-like globals
    const context = {
      require,
      console,
      process,
      Buffer,
      exports: {},
      module: { exports: {} },
    };

    // Execute the script in the context
    const vm = require("vm");
    const script = new vm.Script(scriptContent);
    script.runInNewContext(context);
    console.log("Script executed in VM context.");
    console.log("Exports from script:", context.module.exports);

    // Call the exported function
    if (typeof context.module.exports.generateSchemas === "function") {
      console.log("Found generateSchemas function, executing...");
      context.module.exports.generateSchemas();
      console.log("generateSchemas executed successfully.");
    } else {
      console.error("No function named 'generateSchemas' found in the script.");
    }
  } catch (error: any) {
    console.error("Error fetching or running the script:", error.message);
  }
}

// Function to fetch and run ES Module script
async function fetchAndRunEsmScript(url: string): Promise<void> {
  try {
    console.log(`Fetching script from URL: ${url}`);
    const response = await axios.get(url);
    const scriptContent = response.data as string;
    console.log("Script content fetched successfully.");

    // Write the script to a temporary file
    const tempScriptPath = path.join(process.cwd(), "tempScript.mjs");
    fs.writeFileSync(tempScriptPath, scriptContent);

    // Dynamically import the script as an ES Module
    const module = await import(`file://${tempScriptPath}`);

    // Ensure the function exists
    if (typeof module.generateSchemas === "function") {
      console.log("Found generateSchemas function, executing...");
      module.generateSchemas();
      console.log("generateSchemas executed successfully.");
    } else {
      console.error("No function named 'generateSchemas' found in the script.");
    }

    // Clean up: Remove the temporary script file
    fs.unlinkSync(tempScriptPath);
  } catch (error: any) {
    console.error("Error fetching or running the script:", error.message);
  }
}

// Main setup function
async function setup(): Promise<void> {
  try {
    const moduleType: ModuleType = await select<ModuleType>({
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

    if (moduleType === "CommonJS") {
      await fetchAndRunCjsScript(scriptUrl);
    } else {
      await fetchAndRunEsmScript(scriptUrl);
    }
  } catch (error: any) {
    console.error("Error during setup:", error.message);
  }
}

// Path to check the 'tina' folder in the project root
const projectRoot: string = process.cwd();
const tinaFolderPath: string = path.join(projectRoot, "tina");

// Check if the 'tina' folder exists
fs.access(tinaFolderPath, fs.constants.F_OK, (err) => {
  if (!err) {
    setup().catch((error) =>
      console.error("Error in setup function:", error.message)
    );
  } else {
    console.log(
      'The "tina" folder does not exist. Please visit the following link to install the Tina package first:'
    );
    console.log("https://docs.astro.build/en/guides/cms/tina-cms");
  }
});
