//  Node lib import 
import { argv, config, env } from 'node:process';
import { spawn } from 'node:child_process';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

//  Extern lib import
import { parseJsonSourceFileConfigFileContent, parseJsonText, sys } from 'typescript';
import { z } from 'zod';

//  Constants
const __dirname = dirname(fileURLToPath(import.meta.url));
const __tsconfig = "tsconfig.json";
const __package = "package.json";

//  Script Strings
const Strings = {
    errors: {
        fs: {
            wrongProjectPath: 'The path "${arg}" is not on the project',
            renameFile: 'Could not change the filename'
        },
        pathNotFound: 'The project path "${args}" does not exists',
        invalidObject: "The object has invalid data structure",
        pmNotFound: "No package manager found on the system",
        zod: {
            array: {
                invalid: "The content is not an array-string value"
            },
            records: {
                invalid: "The content must be a string or array-string value"
            },
            strings: {
                invalid: "The content must be text-string",
                invalidLen: "The length of the content is too small",
            },
            shared: {
                requiredVal: "This field is required",
            }
        }
    },
    warns: {
        cli: {
            invalidArg: "No valid action provided, exiting script...",
        }
    }
}

//  String Schemas
const strSchema = z.string({
    required_error: Strings.errors.zod.shared.requiredVal,
    invalid_type_error: Strings.errors.zod.strings.invalid,
});
const nonEmptyStrSchema = strSchema.nonempty().min(1, { message: Strings.errors.zod.strings.invalidLen });
//  Schemas
const loggerLevels = z.enum(['error', 'info', 'warn']);
const pathRecordSchema = z.record(
    nonEmptyStrSchema,
    z.union([
        z.array(nonEmptyStrSchema, {
            invalid_type_error: Strings.errors.zod.array.invalid,
            required_error: Strings.errors.zod.shared.requiredVal
        }),
        nonEmptyStrSchema
    ]),
    { 
        invalid_type_error:  Strings.errors.zod.records.invalid,
        required_error: Strings.errors.zod.shared.requiredVal
    }
);
const tsConfigOptionsSchema = z.object({
    options: z.object({
        outDir: nonEmptyStrSchema,
        paths: pathRecordSchema
    }, { 
        message: "The object must contain outDir and paths." 
    })
}, { message: "The object must contain options." })
const moduleAliasSchema = z.object({
    _moduleAliases: pathRecordSchema
}, { message: "The object must be contain _moduleAliases key" });
const pkmgSchema = z.union([
    z.object({
        PNPM_HOME: nonEmptyStrSchema,
    }),
    z.object({
        variables: z.object({
            node_install_npm: z.boolean().default(false),
        }),
    }),
]);

//  App entry-point
(async function main(){
    const { action = null } = parseArgs();
    try {
        switch(action){
            case 'build':
                await buildProject();
            break;
            case 'run-test':
                await runProjectTests();
            break;
            default: logInfo(Strings.warns.cli.invalidArg, { exit: true });
        }
    } catch (error) {
        logError(error);
    }
})();

//  App functionality
function buildPackageJson() {
    return new Promise(async (resolve, reject) => {
        try {
            const packageJson = await getProjectJsonFile(__package);
            const tsConfigPaths = await getTsconfigPaths();
            const packagePaths = await filterModuleAliases(packageJson._moduleAliases, tsConfigPaths);
            //
            let equalFlag = true;
            //  
            if (Object.keys(tsConfigPaths).length !== Object.keys(packagePaths).length) {
                reject(`${__package} is not the same as ${__tsconfig}`);
            }
            //   
            for (const key in tsConfigPaths) {
                if (!(key in packagePaths)) {
                    reject(`${key} must exist on ${__package} file.`);
                }
                if (tsConfigPaths[key] !== packagePaths[key]) {
                    if (equalFlag) {
                        equalFlag = !equalFlag;
                    }
                    logWarn(`Difference spotted on ${key}: ${packagePaths[key]} replaced with ${tsConfigPaths[key]}`);
                    packagePaths[key] = tsConfigPaths[key];
                }
            }
            //
            equalFlag = !packageJson._moduleAliases || !equalFlag;
            //  
            if(equalFlag) {
                //  
                packageJson._moduleAliases = {
                    ...packageJson._moduleAlias,
                    ...packagePaths
                };
                //  
                const formattedJson = JSON.stringify(packageJson, null, 2);
                //  
                const { oldPath } = await renameProjectFile(__package, `${__package}.old`);
                await writeFile(oldPath, formattedJson, { encoding: 'utf-8', flag: 'w' });
            }
            //
            logInfo(`Job done. ${(!equalFlag) ? 'Nothing changed from the project file' : ''}`.trim());
            //
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}
function buildProject() {
    return new Promise(async (resolve, reject) => {
        try {
            const { manager, tools: { runner } } = await getPackageManager( { ...env, ...config } );
            await buildPackageJson();
            await lintProject(manager, true);
            resolve(
                await runCommand(runner, ['--package=typescript', 'dlx', 'tsc'])
            );
        } catch (error) {
            reject(error);
        }
    })
}
function lintProject(manager, fix = false) {
    return new Promise(async (resolve, reject) => {
        try {
            const args = ['dlx', 'eslint', '.']
            resolve(
                await runCommand(manager, fix ? [...args, '--fix'] : args)
            );
        } catch (error) {
            reject(error);
        }
    })
}
function runProjectTests() {
    return new Promise(async (resolve, reject) => {
        try {
            const { manager, tools: { runner } } = await getPackageManager( { ...env, ...config } );
            await lintProject(manager, true);
            resolve(
                await runCommand(runner, ["jest", "--passWithNoTests"])
            );
        } catch (error) {
            reject(error);
        }
    })
}
//  Filter packageJson pathAlias functionality
function filterModuleAliases(schema, backup) {
    return new Promise(async(resolve, reject) => {
        if (schema && (schema instanceof Object)) {
            const response = await moduleAliasSchema.safeParseAsync( { _moduleAliases: schema } );
            if(!response.success) {
                return reject(response.error);
            }
            resolve(response.data._moduleAliases);
        }
        resolve(backup);
    });
}
//  Filter and validation of tsConfigFile
function validateTSAndFilterPaths( options ) {
    return new Promise(async(resolve, reject) => {
        try {
            const result = await tsConfigOptionsSchema.safeParseAsync(options);
            if(!result.success) {
                reject(Strings.errors.invalidObject);                
            }
            resolve(Object.fromEntries(
                Object.entries(result.data.options.paths).map(([key, value]) => {
                    //  
                    const regex = (/\/\*"?|\/"?$/gm);
                    const newKey = key.replace(regex, '');
                    const newPath = value.shift().replace(regex, '')
                        //  Replace first path portion with out dir
                        .replace(/^([^/]+)/, basename(result.data.options.outDir))
                        //  Convert extension file name with equivalent
                        .replace(/\.(ts|cts|mts)$/, (match) => {
                            switch (match) {
                                case '.ts':
                                    return '.js';
                                case '.cts':
                                    return '.cjs';
                                case '.mts':
                                    return '.mjs';
                                default:
                                    return match;
                            }
                        });
                    //  
                    if (value.length > 0) {
                        logWarn(`_moduleAliases (${__package}) accepts only one value, skipping ('${value.join("', '")}'). Modify ${__tsconfig} to fit requirements`);
                    }
                    //
                    return [newKey, newPath];
                })
            ));
        } catch (error) {
            reject(error);
        }
    });
}
function getTsconfigPaths() {
    return new Promise(async (resolve, reject) => {
        try {
            const config = await getTsconfig();
            const paths = await validateTSAndFilterPaths( config );
            resolve( paths );
        } catch (error) {
            reject(error);
        }
    })
}
function getTsconfig() {
    return new Promise( async (resolve, reject) => {
        try {
            const fileString = await getProjectJsonFile(__tsconfig, true);
            const tsConfigSourceFile = parseJsonText(__tsconfig, fileString);
            const tsConfigParsedConf = parseJsonSourceFileConfigFileContent(tsConfigSourceFile, sys, __dirname);
            resolve(tsConfigParsedConf);
        } catch (error) {
            reject(error);
        }
    });
}
//  FS functionality
function getProjectJsonFile(arg, skipParse = false) {
    return new Promise(async (resolve, reject) => {
        const zodCallBack = (file) => file.endsWith('.json');
        const zodOptions = { expected: "JSON", message: 'Must be json file' };
        const response = await nonEmptyStrSchema.refine(zodCallBack, zodOptions).safeParseAsync(arg);
        if(!response.success) {
            reject(Strings.errors.invalidObject);
        }
        try {
            const response = await getProjectFile(arg);
            if(skipParse) {
                resolve(response);
            }
            resolve(JSON.parse(response));
        }catch(err) {
            reject(err);
        }
    });
}
function getProjectFile(arg) {
    return new Promise(async (resolve, reject) => {
        try {
            const { fullPath: filePath } = await getProjectFilePath(arg);
            logInfo(`Retrieving ${filePath}...`);
            const fileContent = await readFile(filePath, { encoding: 'utf8', flag: 'r' });
            resolve(fileContent);
        } catch (error) {
            reject(error);
        }
    })
}
function getProjectFilePath(arg) {
    const fileName = nonEmptyStrSchema.parse(arg);
    const projectPath = join(__dirname, fileName);
    return new Promise(async (resolve, reject) => {
        try {
            const res = await stat(projectPath);
            resolve({ dirname: dirname(projectPath), fullPath: projectPath, fullName: arg, size: res.size });
        } catch (error) {
            if(error.code === 'ENOENT') {
                reject(Strings.errors.pathNotFound.replace('${args}', projectPath));
            }
            reject(error);
        }
    });
}
function renameProjectFile(oldName, newName) {
    return new Promise(async (resolve, reject) => {
        try {
            const { dirname, fullPath: oldFullPath } = await getProjectFilePath(oldName);
            const newFullPath = join(dirname, (newName) ?? `${oldName}.old`);
            await renameProjectPath(oldFullPath, newFullPath);
            resolve({ oldPath: oldFullPath, newPath: newFullPath });
        } catch (error) {
            reject(error);
        }
    })
}
function renameProjectPath(oldPath, newPath){
    return new Promise(async (resolve, reject) => {
        try {
            if(oldPath.startsWith(__dirname) && newPath.startsWith(__dirname)) {
                await rename(oldPath, newPath);
                logInfo(`Renamed from "${oldPath}" to "${newPath}"`);
                resolve();
            }
            throw new Error(Strings.errors.fs.wrongProjectPath);
        } catch (error) {
            reject(error);
        }
    });
}
//  Shell functionality
function runCommand(command, ...args) {
    return new Promise((resolve, reject) => {
        const shellOpts = getShellOptions();
        const child = spawn(command, ...args, shellOpts);
        const fullCommand = [command, ...(args.flat(Infinity))].join(" ");
        child.on('close', (code) => {
        if (code === 0) {
            resolve(logInfo(`${fullCommand} executed successfuly`));
        } else {
            reject(new Error(`${fullCommand} fail, exitCode: ${code}`));
        }
        });
        child.on('error', (error) => {
        reject(error);
        });
    });
};
function getShellOptions() {
    const baseOptions = { stdio: 'inherit', shell: false };
    switch(platform()){
        case 'win32': return { ...baseOptions, shell: true };
        default: return {...baseOptions};
    }
}
function getPackageManager(data) {
    return new Promise(async (resolve, reject) => {
        const result = await pkmgSchema.safeParseAsync( data );
        if(!result.success){
            reject(Strings.errors.invalidObject);
        }
        if('PNPM_HOME' in result.data) {
            resolve({ manager: 'pnpm', tools: { runner: 'pnpm' } });
        }
        else if(result.data.variables.node_install_npm === true) {
            resolve({ manager: 'npm', tools: { runner: 'npx' } });
        }
        reject(Strings.errors.pmNotFound);
    });
}
//  Shell entry-point functionality
function parseArgs() {
    const args = argv.slice(2);
    const parsed = { _: [] };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            parsed[key] = value !== undefined ? parseValue(value) : true;
            if (value === undefined) {
                if (args[i + 1] && !args[i + 1].startsWith('-')) {
                    parsed[key] = parseValue(args[++i]);
                }
            }
        }
        else if (arg.startsWith('-')) {
            const key = arg.slice(1);
            parsed[key] = args[i + 1] && !args[i + 1].startsWith('-') 
            ? parseValue(args[++i]) 
            : true;
        }
        else {
            parsed._.push(parseValue(arg));
        }
    }
    return parsed;
}
function parseValue(value) {
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
    }
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (value.toLowerCase() === 'null') return null;
    try {
        return JSON.parse(value);
    } catch {
        return value; // Si falla, devuelve el string original
    }
}
function logError(...args) {
    logAndExit(loggerLevels.Values.error, ...[...args, { error: true }]);
}
function logInfo(...args) {
    logAndExit(loggerLevels.Values.info, ...args)
}
function logWarn(...args) {
    logAndExit(loggerLevels.Values.warn, ...args)
}
function logMessage(logLevel, ...args) {
    const level = loggerLevels.default('info').parse(logLevel);
    console[level](`[${level.toUpperCase()}] - ${(args).map((arg) => {
        if(Array.isArray(arg)){
            return JSON.stringify(arg.flat(Infinity));
        }
        return arg;
    }).join(", ")}`);
}
function logAndExit(level, ...args) {
    const code = level === loggerLevels.Values.error ? 1 : 0;
    const func_args = args.pop();
    const { error = false, exit = false } = func_args;
    if(error || exit || code !== 0) {
        logMessage(level, ...args);
        process.exit(code);
    }
    logMessage(level, ...[...args, func_args]);
}