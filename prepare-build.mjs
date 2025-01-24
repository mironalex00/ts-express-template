//  
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, parse } from 'node:path'
import { exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseJsonSourceFileConfigFileContent, parseJsonText, sys } from 'typescript';
import { z, ZodError } from 'zod';

//  Consts
const __dirname = dirname(fileURLToPath(import.meta.url));
const __tsconfig = "tsconfig.json";
const __package = "package.json";

//  Schemas
const loggerLevels = z.enum(['error', 'info', 'warn']);
const pathRecordSchema = z.record(
    z.string().nonempty().min(1),
    z.union([
        z.array(
            z.string().nonempty().min(1)
        ),
        z.string().nonempty().min(1)
    ])
);
const tsConfigOptionsSchema = z.object({
    options: z.object({
        outDir: z.string().nonempty().min(1),
        paths: pathRecordSchema
    })
});
const moduleAliasSchema = z.object({
    _moduleAliases: pathRecordSchema
});

//  Self invocated main
(function main(){
    //  
    const tsconfigJsonString = getProjectJsonFileSync(__tsconfig, true);
    const tsConfigSourceFile = parseJsonText(__tsconfig, tsconfigJsonString);
    const tsConfigParsedConf = parseJsonSourceFileConfigFileContent(tsConfigSourceFile, sys, __dirname);
    //  
    const packageJson = getProjectJsonFileSync(__package);
    //  
    const { outDir, paths: tsconfigPathAliases} = filterPathAliases(tsConfigParsedConf);
    const { _moduleAliases: packageJsonPathAliases } = filterModuleAliases(packageJson, tsconfigPathAliases);
    //  
    let equalFlag = true;
    //  
    if (Object.keys(tsconfigPathAliases).length !== Object.keys(packageJsonPathAliases).length) {
        logError(`${__package} is not the same as ${__tsconfig}`);
    }
    //  
    for(const key in tsconfigPathAliases){
        if(!(key in packageJsonPathAliases)) {
            logError(`${key} must exist on ${__package} file.`);
        }
        if (tsconfigPathAliases[key] !== packageJsonPathAliases[key]) {
            if(equalFlag) {
                equalFlag = !equalFlag;
            }
            logWarn(`Difference spotted on ${key}: ${packageJsonPathAliases[key]} replaced with ${tsconfigPathAliases[key]}`);
            packageJsonPathAliases[key] = tsconfigPathAliases[key];
        }
    }
    //
    if(!equalFlag || !packageJson._moduleAliases) {
        //    
        packageJson._moduleAliases = {
            ...packageJson._moduleAlias,
            ...packageJsonPathAliases
        };
        //  
        const formattedJson = JSON.stringify(packageJson, null, 2);
        //  
        renameProjectFileSync(__package, `${__package}.old`);
        //
        writeFileSync(getProjectFilePath(__package), formattedJson, "utf-8");
        logInfo('Job done.');
    }
    logInfo('Job done. Nothing changed');
    
})();
//  Filter Path-Alias Functionality
function filterModuleAliases(pathAliases, tsconfigPathAliases) {
    if(pathAliases._moduleAliases) {
        return { _moduleAliases: moduleAliasSchema.parse(pathAliases)._moduleAliases };
    }
    return { _moduleAliases: tsconfigPathAliases };
}
function filterPathAliases(tsConfigOptions){
    //  
    const result =  tsConfigOptionsSchema.parse(tsConfigOptions);
    //  
    const  { outDir, paths: oldPaths } = result.options;
    //
    const newPaths = Object.fromEntries(
        Object.entries(oldPaths).map(([key, value]) => {
            //  
            const regex = (/\/\*"?|\/"?$/gm);
            const newKey = key.replace(regex, '');
            const newPath = value.shift().replace(regex, '')
            //  Replace first path portion with out dir
            .replace(/^([^/]+)/, basename(outDir))
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
            if(value.length > 0) {
                logWarn(`_moduleAliases (${__package}) accepts only one value, skipping ('${value.join("', '")}'). Modify ${__tsconfig} to fit requirements`);
            }
            //
            return [newKey, newPath];
        })
    );
    return { outDir, paths: newPaths };
}
//  FS Funcionality
function getProjectJsonFileSync(arg, skipParser = false) {
    try {
        const zodCallBack = (file) => file.endsWith('.json');
        const zodOptions = { expected: "JSON",  message: 'Must be json file' };
        const fileName = z.string().nonempty().refine(zodCallBack, zodOptions).parse(arg);
        const fileContent = getProjectFileSync(fileName);
        logWarn(`Parsing ${fileName}...`);
        if(!skipParser) return JSON.parse(fileContent);
        return fileContent;
    } catch (err) {
        if(err instanceof ZodError){
            let errorOutput = "";
            if(err.errors.length === 1)
                errorOutput = err.errors[0].message;
            else 
                errorOutput = err.errors.map((err) => `${err.expected} - ${err.message}`).join(", ");
            logError(`ZOD: ${errorOutput}`);
        }else {
            logError(`Unknown: ${ err }`);
        }
    }
}
function getProjectFileSync(arg) {
    try {
        const fileName = getProjectFilePath(arg);
        logWarn(`Retrieving ${fileName}...`);
        const fileContent = readFileSync(fileName, { encoding: "utf8", flag: "r" });
        return fileContent;
    } catch (err) {
        logError(`Could not retrieve file's (${arg}) content: ${ err }`)        
    }
}
function renameProjectFileSync(oldFileName, newFileName) {
    const filePath = getProjectFilePath(oldFileName);
    const newFilePath = getProjectFilePath(newFileName);
    //  
    try {
        //  
        renameSync(filePath, newFileName);
        //
        logWarn(`Renamed from ${filePath} to ${newFilePath}`);
    } catch (err) {
        logError(`Could not rename ${oldFileName}: ${err}`);        
    }
}
function getProjectFilePath(arg) {
    const fileName = z.string().nonempty().parse(arg);
    return join(__dirname, fileName); 
}
//  Log functionality
function logError(...args) {
    logAndExit(loggerLevels.Values.error, ...args)
}
function logInfo(...args) {
    logAndExit(loggerLevels.Values.info, ...args)
}
function logWarn(...args) {
    logMessage(loggerLevels.Values.warn, ...args)
}
function logMessage(logLevel, ...args) {
    const level = loggerLevels.default('info').parse(logLevel)
    console[level](`[${level.toUpperCase()}] - ${args.join(", ")}`);
}
function logAndExit(level,...args) {
    const code = level === loggerLevels.Values.error ? 1 : 0;
    logMessage(level, ...args);
    exit(code);
}