#!/usr/bin/env node
'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const axios_1 = tslib_1.__importDefault(require("axios"));
const prompts_1 = require("@inquirer/prompts");
const vm_1 = tslib_1.__importDefault(require("vm"));
// Function to fetch and run script from URL
function fetchAndRunScript(url, moduleType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(url);
            if (moduleType === "CommonJS") {
                // CommonJS context setup
                const script = new vm_1.default.Script(response.data);
                const context = vm_1.default.createContext({
                    require,
                    console,
                    process,
                    exports: {},
                    module: { exports: {} },
                });
                script.runInContext(context);
                // If the script exports something, you can access it here
                console.log("Script output:", context.module.exports);
            }
            else if (moduleType === "ES Modules") {
                // Dynamically import ES module
                const blob = new Blob([response.data], { type: "application/javascript" });
                const urlObject = URL.createObjectURL(blob);
                const module = yield Promise.resolve(`${urlObject}`).then(s => tslib_1.__importStar(require(s)));
                console.log("ES Module script output:", module);
                // Revoke the object URL to avoid memory leaks
                URL.revokeObjectURL(urlObject);
            }
        }
        catch (error) {
            console.error("Error fetching or running the script:", error);
        }
    });
}
// Function to set up the package
function setup() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const moduleType = yield (0, prompts_1.select)({
            message: "Is your project using CommonJS or ES Modules?",
            choices: [
                { name: "CommonJS", value: "CommonJS" },
                { name: "ES Modules", value: "ES Modules" },
            ],
        });
        const scriptUrl = moduleType === "CommonJS"
            ? "https://raw.githubusercontent.com/tfmurad/tina-schema-generator/main/dist/scripts/generate-tina-schema.cjs"
            : "https://raw.githubusercontent.com/tfmurad/tina-schema-generator/main/dist/scripts/generate-tina-schema.mjs";
        yield fetchAndRunScript(scriptUrl, moduleType);
    });
}
// Path to check the 'tina' folder in the project root
const projectRoot = process.cwd();
const tinaFolderPath = path_1.default.join(projectRoot, "tina");
// Check if the 'tina' folder exists
fs_1.default.access(tinaFolderPath, fs_1.default.constants.F_OK, (err) => {
    if (!err) {
        setup();
    }
    else {
        console.log('The "tina" folder does not exist. Please visit the following link to install the Tina package first:');
        console.log("https://docs.astro.build/en/guides/cms/tina-cms");
    }
});
