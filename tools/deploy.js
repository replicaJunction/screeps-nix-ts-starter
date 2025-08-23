// https://github.com/rustyscreeps/screeps-starter-rust/blob/main/js_tools/deploy.js

import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readdirSync, readFile, readFileSync } from "fs";
import { emptyDir } from "fs-extra";
import path from "path";
import { rollup } from "rollup";
import { ScreepsAPI } from "screeps-api";
import yaml from "yamljs";

import yargs from "yargs";

const argv = yargs(process.argv.slice(2))
    .option("server", {
        describe:
            "Server name to connect to. This must be defined in the .screeps.yaml file.",
    })
    .demandOption("server")
    .option("what-if", {
        describe: "Build the code, but do not actually push it to the server.",
        type: "boolean",
        default: false,
    })
    .parse();

/**
 * Load configuration from the unified config file for the given server.
 * @param server {string} Name of the server (must match config file)
 */
function load_config(server) {
    const yaml_conf = yaml.parse(
        readFileSync(".screeps.yaml", { encoding: "utf8" }),
    );
    const configs = yaml_conf.configs || {};
    if (!yaml_conf.servers[server]) {
        console.log(
            `No configuration was found for server ${server} in .screeps.yaml`,
        );
        return;
    }

    const branch = yaml_conf.servers[server].branch || "default";
    const available_mb = configs.available_mb || 5;

    return { branch, available_mb };
}

async function clear_output_dir() {
    console.log("Clearing output directory");
    await emptyDir("dist");
}

async function run_rollup() {
    console.log("Running Rollup");
    const bundle = await rollup({
        input: "src/main.ts",
        plugins: [
            commonjs(),
            nodeResolve(),
            typescript(),
            babel({
                babelHelpers: "bundled",
                presets: ["@babel/preset-typescript", "@babel/preset-env"],
                targets: {
                    node: 12,
                },
            }),
        ],
    });
    await bundle.write({
        file: "dist/main.js",
        format: "cjs",
        sourcemap: true,
    });
}

function load_dist_file(filename) {
    const data = readFileSync(`dist/${filename}`, { encoding: "utf8" });
    const fileSize = data.length;
    const moduleName = filename.endsWith(".js")
        ? filename.replace(/\.js$/, "")
        : filename;
    return { moduleName, fileSize, data };
}

async function load_built_code(available_mb) {
    console.log("Reading back code");
    let modules = {};
    let used_bytes = 0;

    ["main.js", "main.js.map"].forEach((filename) => {
        const thisFile = load_dist_file(filename);
        modules[thisFile.moduleName] = thisFile.data;
        used_bytes += thisFile.fileSize;
    });

    const used_mib = used_bytes / (1024 * 1024);
    const used_percent = (100 * used_mib) / available_mb;

    return { used_mib, used_percent, modules };
}

async function upload(code, server, config, whatIf) {
    console.log("Uploading:");
    console.log(`    - Server: ${server}`);
    console.log(`    - Branch: ${config.branch}`);
    console.log(
        `    - Used:   ${code.used_mib.toFixed(2)}MiB of ${config.available_mb.toFixed(2)}MiB (${code.used_percent.toFixed(2)}%)`,
    );

    if (whatIf) {
        console.log("WHAT-IF: Not uploading");
    } else {
        console.log("Uploading");
        const api = await ScreepsAPI.fromConfig(server);
        const response = await api.code.set(config.branch, code.modules);
        console.log(JSON.stringify(response));
    }
}

async function run() {
    const config = load_config(argv.server);
    if (!config) {
        return;
    }

    await clear_output_dir();
    await run_rollup();

    const code = await load_built_code(config.available_mb);
    await upload(code, argv.server, config, argv.whatIf);
}

run().catch(console.error);
