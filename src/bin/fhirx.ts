#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { Compiler } from '../compiler/compiler';
import { CompilerTypes } from '../compiler/compiler.interfaces';

enum CMD {
  LOAD_STRUCTURE_DEFINITION = '--load-structure-definition',
  COMPILE = '--compile',
  PATCH_RESOURCES = '--patch-resources'
}

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error(`Missing argument. Supported arguments: ${Object.values(CMD).join(' OR ')}`);
  process.exit();
}

const SUPPORTED_COMMANDS = Object.values<string>(CMD);

const cmd = args[0];
if (!SUPPORTED_COMMANDS.includes(cmd)) {
  console.error(`Invalid argument: ${cmd}. Supported arguments: ${SUPPORTED_COMMANDS.join(' OR ')}`);
  process.exit();
}

const getRootDir = (dir = __dirname) => {
  const name = path.basename(dir);

  if (name === 'node_modules') {
    return path.resolve(dir, '../');
  }

  return getRootDir(path.resolve(dir, '../'));
}

const CONFIG_FILE_NAME = 'fhirx.config.js';

const rootDir = getRootDir();

const configFilePath = path.resolve(rootDir, CONFIG_FILE_NAME);

const configFileExists = fs.existsSync(configFilePath);

if (!configFileExists) {
  console.error(`Missing ${CONFIG_FILE_NAME} file in the root of the application.`);
  process.exit();
}

const config = require(configFilePath) as CompilerTypes.Config;
const compiler = new Compiler(config, rootDir);

(async () => {
  try {
    switch (cmd) {
      case CMD.LOAD_STRUCTURE_DEFINITION: {
        await compiler.load();
        break;
      }
      case CMD.COMPILE: {
        await compiler.compile();
        break;
      }
      case CMD.PATCH_RESOURCES: {
        await compiler.patchResources();
        break;
      }
    }
  } catch (e) {
    console.error(e);
    process.exit();
  }
})();
