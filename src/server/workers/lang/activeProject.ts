/**
 * Manages active project.
 * Also pushes errors out to clients + keeps the language service + fileModelCache in sync
 *
 * When the app starts the active project is determined by `session.ts`
 *
 * If there is a tsconfig.json associated with the activeProject, we watch it.
 * If it changes we reload all our information about the project.
 * If it contains parse errors we send them through to all connected clients.
 */

import utils = require("../../../common/utils");
import * as json from "../../../common/json";
import * as tsconfig from "./core/tsconfig";
import * as project from "./core/project";
import * as types from "../../../common/types";
import {setErrorsByFilePaths, clearErrors, clearErrorsForFilePath} from "./cache/errorsCache";
import {diagnosticToCodeError} from "./modules/building";
import {makeBlandError} from "../../../common/utils";
import {TypedEvent} from "../../../common/events";
import equal = require('deep-equal');

// ASYNC
// import * as wd from "../../disk/workingDir";
// import * as fmc from "../../disk/fileModelCache";
// import * as session from "../../disk/session";
// import * as flm from "../fileListing/fileListingMaster";
// import * as workingDir from "../../disk/workingDir";

/** on server start */
export function start() {

    // ASYNC
    // Keep session on disk in sync
    // activeProjectConfigDetailsUpdated.on((ap)=>{
    //     if (ap.tsconfigFilePath) {
    //         session.setTsconfigPath(ap.tsconfigFilePath);
    //     }
    // });

    // Helps us sync only once in the beginning
    let synced = false;

    // Resume session
    // ASYNC
    // let ses = session.readDiskSessionsFile();
    // if (ses.relativePathToTsconfig) {
    //     let tsconfig = workingDir.makeAbsolute(ses.relativePathToTsconfig);
    //     if (fs.existsSync(tsconfig)) {
    //         activeProjectConfigDetails = Utils.tsconfigToActiveProjectConfigDetails(tsconfig);
    //         activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
    //         syncCore(activeProjectConfigDetails);
    //         synced = true;
    //     }
    // }

    // ASYNC
    // refreshAvailableProjects()
    //     .then(() => !synced && sync());
}

/** The active project name */
let activeProjectConfigDetails: ActiveProjectConfigDetails = null;
export let activeProjectConfigDetailsUpdated = new TypedEvent<ActiveProjectConfigDetails>();
export let activeProjectFilePathsUpdated = new TypedEvent<{filePaths:string[]}>();

/** The name used if we don't find a project */
let implicitProjectName = "__auto__";

/** The currently active project */
let currentProject: project.Project = null;

/** All the available projects */
export let availableProjects = new TypedEvent<ActiveProjectConfigDetails[]>();
function refreshAvailableProjects() {
    // ASYNC
    // return flm.filePathsCompleted.current().then((list) => {
    //     // Detect some tsconfig.json
    //     let tsconfigs = list.filePaths.map(t=> t.filePath).filter(t=> t.endsWith('tsconfig.json'));
    //     // sort by shortest length first (with extra big weight for node_modules):
    //     let weightConfig = (config: string) => config.includes('node_modules') ? config.length + 100 : config.length;
    //     tsconfigs = tsconfigs.sort(function(a, b) {
    //         return weightConfig(a) - weightConfig(b);
    //     });
    //
    //     let projectConfigs: ActiveProjectConfigDetails[] = tsconfigs.map(Utils.tsconfigToActiveProjectConfigDetails);
    //
    //     // If no tsconfigs add an implicit one!
    //     if (projectConfigs.length == 0) {
    //         projectConfigs.push({
    //             name: implicitProjectName,
    //             isImplicit: true,
    //         });
    //     };
    //
    //     availableProjects.emit(projectConfigs);
    // });
}

/**
  * Changes the active project.
  * Clear any previously reported errors and recalculate the errors
  * This is what the user should call if they want to manually sync as well
  */
export function setActiveProjectConfigDetails(_activeProjectConfigDetails: ActiveProjectConfigDetails) {
    activeProjectConfigDetails = _activeProjectConfigDetails;
    activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
    clearErrors();
    sync();
}

/** convert project name to current project */
export function sync() {
    availableProjects.current().then((projectConfigs) => {
        let activeProjectName = (activeProjectConfigDetails && activeProjectConfigDetails.name);
        // we are guaranteed as least one project config (which just might be the implicit one)
        let projectConfig = projectConfigs.filter(x=>x.name == activeProjectName)[0] || projectConfigs[0];
        syncCore(projectConfig);
    });
}

/** call this after we have some verified project config */
function syncCore(projectConfig:ActiveProjectConfigDetails){
    let activeProjectName = (activeProjectConfigDetails && activeProjectConfigDetails.name);
    currentProject = null;

    let configFileDetails = ConfigFile.getConfigFileFromDiskOrInMemory(projectConfig)
    currentProject = ConfigFile.createProjectFromConfigFile(configFileDetails);
    activeProjectFilePathsUpdated.emit({filePaths:currentProject.getFilePaths()});

    // If we made it up to here ... means the config file was good :)
    if (!projectConfig.isImplicit) {
        clearErrorsForFilePath(projectConfig.tsconfigFilePath);
    }

    // Set the active project (the project we get returned might not be the active project name)
    // e.g. on initial load
    if (activeProjectName !== projectConfig.name) {
        activeProjectConfigDetails = projectConfig;
        activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
    }

    initialSync = true;
    refreshAllProjectDiagnostics();
}

/**
 * As soon as we get a new file listing refresh available projects
 */
// ASYNC
// flm.filePathsUpdated.on(function(data) {
//     refreshAvailableProjects();
// });

/**
 * As soon as file changes on disk do a full reconcile ....
 */
// ASYNC
// fmc.savedFileChangedOnDisk.on((evt) => {
//     // Check if its a part of the current project .... if not ignore :)
//     let proj = GetProject.ifCurrent(evt.filePath)
//     if (proj) {
//         proj.languageServiceHost.setContents(evt.filePath, evt.contents);
//         refreshAllProjectDiagnosticsDebounced();
//     }
// });
/**
 * As soon as edit happens apply to current project
 */
// fmc.didEdit.on((evt) => {
//     let proj = GetProject.ifCurrent(evt.filePath)
//     if (proj) {
//         proj.languageServiceHost.applyCodeEdit(evt.filePath, evt.edit.from, evt.edit.to, evt.edit.newText);
//         // For debugging
//         // console.log(proj.languageService.getSourceFile(evt.filePath).text);
//
//         // update errors for this file if its *heuristically* small
//         if (evt.edit.from.line < 1000)
//         {
//             refreshFileDiagnostics(evt.filePath);
//         }
//
//         // After a while update all project diagnostics as well
//         refreshAllProjectDiagnosticsDebounced();
//     }
//
//     // Also watch edits to the current config file
//     let currentConfigFilePath = activeProjectConfigDetails && activeProjectConfigDetails.tsconfigFilePath;
//     if (evt.filePath == currentConfigFilePath){
//         sync();
//     }
// });

/**
 * If there hasn't been a request for a while then we refresh
 * As its a bit slow to get *all* the errors
 */
let initialSync = false;
const refreshAllProjectDiagnostics = () => {
    if (currentProject) {
        if (initialSync) {
            console.log(`[TSC] Started Initial Error Analysis: ${currentProject.configFile.projectFilePath}`);
            console.time('[TSC] Initial Error Analysis');
        }
        else {
            console.log(`[TSC] Incremental Error Analysis ${currentProject.configFile.projectFilePath}`);
            console.time('[TSC] Incremental Error Analysis');
        }


        // Get all the errors from the project files:
        let diagnostics = currentProject.getDiagnostics();
        let errors = diagnostics.map(diagnosticToCodeError);
        let filePaths = currentProject.getFilePaths();
        setErrorsByFilePaths(filePaths, errors);

        if (initialSync) {
            console.timeEnd('[TSC] Initial Error Analysis');
        }
        else {
            console.timeEnd('[TSC] Incremental Error Analysis');
        }
        console.log(`[TSC] FileCount: ${filePaths.length}, ErrorCount: ${errors.length}`)
        initialSync = false;
    }
};
const refreshAllProjectDiagnosticsDebounced = utils.debounce(refreshAllProjectDiagnostics, 3000);

/**
 * Constantly streaming this is slow for large files so this is debounced as well
 */
const refreshFileDiagnostics = utils.debounce((filePath:string) => {
    let proj = GetProject.ifCurrent(filePath)
    if (proj) {
        let diagnostics = proj.getDiagnosticsForFile(filePath);
        let errors = diagnostics.map(diagnosticToCodeError);
        setErrorsByFilePaths([filePath], errors);
    }
}, 1000);

/**
 * Utility functions to convert a `configFile` to a `project`
 */
import fs = require("fs");
import path = require("path");
import {Project} from "./core/project";
import {getOpenFiles} from "../../disk/fileModelCache";
namespace ConfigFile {

    /** Create a project from a project file */
    export function createProjectFromConfigFile(configFile: tsconfig.TypeScriptConfigFileDetails) {
        var project = new Project(configFile);

        // Update the language service host for any unsaved changes
        getOpenFiles().forEach(fileModel=> {
            if (project.includesSourceFile(fileModel.config.filePath)) {
                project.languageServiceHost.setContents(fileModel.config.filePath, fileModel.getContents());
            }
        });

        return project;
    }

    /**
     * Project file error reporting
     */
    function reportProjectFileErrors(ex: Error, filePath: string) {
        var err: Error = ex;
        if (ex.message === tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED
            || ex.message === tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS
            || ex.message === tsconfig.errors.GET_PROJECT_GLOB_EXPAND_FAILED) {
            let details: tsconfig.ProjectFileErrorDetails = ex.details;
            setErrorsByFilePaths([filePath], [details.error]);
        }
        else {
            setErrorsByFilePaths([filePath], [makeBlandError(filePath, `${ex.message}`)]);
        }
    }


    /**
     * This explicilty loads the project from the filesystem
     * For (lib.d.ts) and other (.d.ts files where project is not found) creation is done in memory
     */
    export function getConfigFileFromDiskOrInMemory(config: ActiveProjectConfigDetails): tsconfig.TypeScriptConfigFileDetails {
        if (!config.tsconfigFilePath) {
            // TODO: THIS isn't RIGHT ...
            // as this function is designed to work *from a single source file*.
            // we need one thats designed to work from *all source files*.
            return tsconfig.getDefaultInMemoryProject(process.cwd());
        }

        const filePath = config.tsconfigFilePath;

        try {
            // If we are asked to look at stuff in lib.d.ts create its own project
            if (path.dirname(filePath) == project.typescriptDirectory) {
                return tsconfig.getDefaultInMemoryProject(filePath);
            }

            const projectFile = tsconfig.getProjectSync(filePath);
            clearErrorsForFilePath(projectFile.projectFilePath);
            return projectFile;
        } catch (ex) {
            if (ex.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
                // If we have a .d.ts file then it is its own project and return
                if (tsconfig.endsWith(filePath.toLowerCase(), '.d.ts')) {
                    return tsconfig.getDefaultInMemoryProject(filePath);
                }
                else {
                    setErrorsByFilePaths([filePath], [makeBlandError(filePath, 'No project file found')]);
                    throw ex;
                }
            }
            else {
                reportProjectFileErrors(ex, filePath);
                throw ex;
            }
        }
    }
}


/** Get project functions */
export namespace GetProject {
    /**
     * Utility function used all the time
     */
    export function ifCurrent(filePath: string): project.Project {
        if (currentProject && currentProject.includesSourceFile(filePath)) {
            return currentProject;
        }
    }

    /**
     * Sometimes (e.g in the projectService) you want to error out
     * because these functions should not be called if there is no active project
     */
    export function ifCurrentOrErrorOut(filePath: string): project.Project {
        let proj = ifCurrent(filePath);

        if (!proj) {
            console.error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH, filePath);
            throw new Error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH);
        }

        return proj;
    }

    /**
     * Get current if any
     */
    export function getCurrentIfAny(): project.Project {
        if (!currentProject) {
            console.error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_GLOBAL);
            throw new Error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_GLOBAL);
        }
        return currentProject;
    }
}

/** General purpose utility functions specific to this file */
namespace Utils {
    // ASYNC
    // export function tsconfigToActiveProjectConfigDetails(tsconfig: string): ActiveProjectConfigDetails {
    //     let relative = workingDir.makeRelative(tsconfig);
    //     let isNodeModule = relative.includes('node_modules');
    //     return {
    //         name: isNodeModule ? relative : utils.getDirectoryAndFileName(tsconfig),
    //         isImplicit: false,
    //         tsconfigFilePath: tsconfig
    //     };
    // }
}
