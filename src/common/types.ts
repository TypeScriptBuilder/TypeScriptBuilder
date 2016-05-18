/**
 * Its Types (e.g. enums) + constants :)
 */

export const cacheDir = './.alm';
export const title = "Application Lifecycle Management tools for TypeScript";

export enum TriState {
    Unknown,
    True,
    False,
}

export const errors = {
    CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH: "A query *that needs an active project* was made when there is no active project for given filePath",
    CALLED_WHEN_NO_ACTIVE_PROJECT_GLOBAL: "A query *that needs an active project* was made when there is no active project"
}

/**
 * Session related types
 */
export interface SessionsFileContents {
    sessions: SessionOnDisk[];
    /** Relative path to tsconfig.json including file name */
    relativePathToTsconfig?: string;
}
export interface SessionOnDisk {
    /** unique to each session */
    id: string;
    /** the tabs the user has open */
    openTabs: SessionTabOnDisk[];
    /** Duration since epoch */
    lastUsed: number;
}
export interface SessionTabOnDisk {
    relativeUrl: string;
}
/**
 * The UI version of session. Basically its all absolute paths and tab urls
 * also UI is not in control of active project so it doesn't sent that
 */
export interface SessionTabInUI {
    url: string;
}

/**
 * Refactoring related stuff
 */
export interface Refactoring extends ts.TextChange {
    filePath: string;
}

/**
 * Because you generally want to transact per file
 * You don't need to create this manually. Just use `getRefactoringsByFilePath`
 */
export interface RefactoringsByFilePath {
    [filePath: string]: Refactoring[];
}

/**
 * Reason is we want to transact by file path
 * Also, this function sorts per file so you can apply refactorings in order 🌹
 */
export function getRefactoringsByFilePath(refactorings: Refactoring[]) {
    var loc: RefactoringsByFilePath = {};
    for (let refac of refactorings) {
        if (!loc[refac.filePath]) loc[refac.filePath] = [];
        loc[refac.filePath].push(refac);
    }

    // sort each of these in descending by start location
    for (let filePath in loc) {
        let refactorings = loc[filePath];
        refactorings.sort((a: Refactoring, b: Refactoring) => {
            return (b.span.start - a.span.start);
        });
    }

    return loc;
}

/**
 * For file listing we like to know if its a dir or file
 */
export enum FilePathType {
    File,
    Dir
}
export interface FilePath {
    filePath: string;
    type: FilePathType
}
/** For incremental buffered file listing changes */
export interface FileListingDelta {
    addedFilePaths: FilePath[];
    removedFilePaths: FilePath[];
}

/**
 * File model stuff
 */
export interface FileStatus {
    filePath: string;
    saved: boolean;
    eol: string;
}

/**
 * Project JS File status stuff
 */
export interface JSOutputStatus {
    /** Its convinient to have it hare */
    inputFilePath: string;

    /** One of the various states */
    state: JSOutputState;

    /** Only if the state is for some JS file */
    outputFilePath?: string;
}
/** The JS file can only be in one of these states */
export enum JSOutputState {
    /** As it is from the TypeScript language service. Either emit is blocked or compiler options are noEmit */
    EmitSkipped,
    /** If emit not skipped perhaps there isn't a JS file emit for this (e.g .d.ts files) */
    NoJSFile,
    /** If JS file then its one of these */
    JSUpToDate,
    JSOutOfDate,
}
export type JSOutputStatusCache = { [inputFilePath: string]: JSOutputStatus }
export type LiveBuildResults = {
    builtCount: number;
    totalCount: number;
}

/**
 * Complete related stuff
 */
export interface Completion {
    /** stuff like "var"|"method" etc */
    kind?: string;
    /** stuff like "toString" */
    name?: string;
    /** This is displayParts (for functions). Empty for `var` etc. */
    display?: string;
    /** the docComment if any */
    comment?: string;

    /** If snippet is specified then the above stuff is ignored */
    snippet?: {
        name: string;
        description: string;
        template: string;
    };

    /** If a path completion is specified then the above stuff is ignored */
    pathCompletion?: {
        fileName: string;
        relativePath: string;
        fullPath: string;
        // TODO:
        // Also tell about the `string` start and end `index` which is what the completion should replace
    }
}

/**
 * Editor Config stuff
 */
export interface EditorOptions {
    indentSize: number;
    tabSize: number;
    newLineCharacter: string;
    convertTabsToSpaces: boolean;
}


/**
 * TSConfig details
 */

/**
 * These are the projects that the user can select from.
 * Just the name and config path really
 */
export interface AvailableProjectConfig {
    name: string;
    isImplicit: boolean;
    tsconfigFilePath?: string;
}

/**
 * Project Data : the config file + all the file path contents
 */
export interface FilePathWithContent {
    filePath: string;
    contents: string;
}
export interface ProjectDataLoaded {
    configFile: TypeScriptConfigFileDetails;
    filePathWithContents: FilePathWithContent[];
}

/**
 * Our analysis of stuff we want from package.json
 */
export interface PackageJsonParsed {
    /** We need this as this is the name the user is going to import **/
    name: string;
    /** we need this to figure out the basePath (will depend on how `outDir` is relative to this directory) */
    directory: string;
    /** This is going to be typescript.definition */
    definition: string;
    main: string;
}

/**
 * This is `TypeScriptProjectRawSpecification` parsed further
 * Designed for use throughout out code base
 */
export interface TsconfigJsonParsed {
    compilerOptions: ts.CompilerOptions;
    files: string[];
    typings: string[]; // These are considered externs for .d.ts. Note : duplicated in files
    filesGlob?: string[];
    formatCodeOptions: ts.FormatCodeOptions;
    compileOnSave: boolean;
    buildOnSave: boolean;
    package?: PackageJsonParsed;
}

export interface TypeScriptConfigFileDetails {
    /** The path to the project file. This acts as the baseDIR */
    projectFileDirectory: string;
    /** The actual path of the project file (including tsconfig.json) */
    projectFilePath: string;
    project: TsconfigJsonParsed;
    inMemory: boolean;
}

/**
 * Git types
 */
/** Note : 0,2 means lines 0,1,2  */
export type GitDiffSpan = {
    from: number;
    to: number;
}
export type GitDiff = {
    added: GitDiffSpan[];
    removed: number[];
    modified: GitDiffSpan[];
}

/**
 * Errors
 */
export enum ErrorsDisplayMode {
    all = 1,
    openFiles = 2,
}


/**
 * Documentation related stuff
 */
/** for project symbols view */
export interface NavigateToItem {
    name: string;
    kind: string;
    filePath: string;
    position: EditorPosition;
    fileName: string;
}
export interface GetNavigateToItemsResponse {
   items: NavigateToItem[];
}

/**
 * The TypeDoc icons a pretty expansive 🌹 with a few ideas that I disagree with / or think are too difficult.
 * E.g the type `event`. The "grey" coloring of the global functions. The following is a simpler subset.
 *
 * Places that need to be kept in sync:
 * - typeIcon.tsx: the location in typeIcons.svg
 * - the legend component
 * - the server responses
 */
export enum IconType {
    /**
     * There can be only one global
     * Any of the remaining things can be either in a module or global
     */
    Global,

    Namespace, // same for module
    Variable,
    Function,
    FunctionGeneric,

    Enum,
    EnumMember,

    Interface,
    InterfaceGeneric,
    InterfaceConstructor,
    InterfaceProperty,
    InterfaceMethod,
    InterfaceMethodGeneric,
    InterfaceIndexSignature,

    Class,
    ClassGeneric,
    ClassConstructor,
    ClassProperty,
    ClassMethod,
    ClassMethodGeneric,
    ClassIndexSignature,
}

/**
 * The documentation model
 * We have
 * - global
 * - modules
 *
 * These are just "name" + containers for OtherThings
 *
 * OtherThings are just:
 * - class
 * - namespace
 * - interface / type
 * - enum
 *
 * Where Namespace is just a "name" container for OtherThings
 */
export interface DocumentedType {
    name: string;
    icon: IconType,
    comment: string,
    subItems: DocumentedType[];
    location: DocumentedTypeLocation;
}

export interface DocumentedTypeLocation {
    filePath: string,
    position: EditorPosition,
}

/** For top level module names */
export interface GetTopLevelModuleNamesResponse {
    /** Present in our project */
    files: DocumentedType[];
}
