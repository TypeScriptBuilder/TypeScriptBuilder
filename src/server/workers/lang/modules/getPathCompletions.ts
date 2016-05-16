import * as path from "path";
import {Project} from "../core/project";
import * as utils from "../../../../common/utils";
import * as fsu from "../../../utils/fsu";
import * as types from "../../../../common/types";
import {Types} from "../../../../socket/socketContract";

import fuzzaldrin = require('fuzzaldrin');

/** From https://github.com/Microsoft/TypeScript/pull/2173/files */
function getExternalModuleNames(program: ts.Program): string[] {
    var entries: string[] = [];

    program.getSourceFiles().forEach(sourceFile => {

        // Look for ambient external module declarations
        ts.forEachChild(sourceFile, child => {
            if (child.kind === ts.SyntaxKind.ModuleDeclaration && (<ts.ModuleDeclaration>child).name.kind === ts.SyntaxKind.StringLiteral) {
                entries.push((<ts.ModuleDeclaration>child).name.text);
            }
        });
    });

    return entries;
}

/** This is great for auto import */
export interface GetPathCompletions {
    prefix: string;
    project: Project;
    filePath: string;
}
/** This is great for autocomplete */
export interface GetPathCompletionsForAutocomplete extends GetPathCompletions {
    position: number;
}

function isStringLiteralInES6ImportDeclaration(node: ts.Node) {
    if (node.kind !== ts.SyntaxKind.StringLiteral) return false;
    while (node.parent.kind !== ts.SyntaxKind.SourceFile
        && node.parent.kind !== ts.SyntaxKind.ImportDeclaration) {
        node = node.parent;
    }
    return node.parent && node.parent.kind === ts.SyntaxKind.ImportDeclaration;
}
function isStringLiteralInImportRequireDeclaration(node: ts.Node) {
    if (node.kind !== ts.SyntaxKind.StringLiteral) return false;
    while (node.parent.kind !== ts.SyntaxKind.SourceFile
        && node.parent.kind !== ts.SyntaxKind.ImportEqualsDeclaration) {
        node = node.parent;
    }
    return node.parent && node.parent.kind === ts.SyntaxKind.ImportEqualsDeclaration;
}

/** Removes the quote characters / `.` and `/` as they cause fuzzaldrin to break */
function sanitizePrefix(prefix: string){
    const result = prefix.replace(/\.|\/|\'|\"|/g, '');
    return result;
}

export function getPathCompletionsForImport(query: GetPathCompletions): types.Completion[] {
    var project = query.project;
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.configFile.project.files.filter(p => p !== query.filePath && !p.endsWith('.json'));
    var files: {
        fileName: string;
        relativePath: string;
        fullPath: string;
    }[] = [];

    var externalModules = getExternalModuleNames(project.languageService.getProgram());
    externalModules.forEach(e => files.push({
        fileName: `${e}`,
        relativePath: e,
        fullPath: e
    }));

    filePaths.forEach(p=> {
        files.push({
            fileName: fsu.removeExt(utils.getFileName(p)),
            relativePath: fsu.removeExt(fsu.makeRelativePath(sourceDir, p)),
            fullPath: p
        });
    });

    const sanitizedPrefix = sanitizePrefix(query.prefix);
    const endsInPunctuation: boolean = utils.prefixEndsInPunctuation(sanitizedPrefix);
    if (!endsInPunctuation)
        files = fuzzaldrin.filter(files, sanitizedPrefix, { key: 'fileName' });

    return files.map(f => {
        const result: types.Completion = { pathCompletion: f };
        return result;
    });
}

/**
 * Very similar to above. But
 * - aborts if position not valid to autocomplete
 * - automatically excludes `externalModules` if position is reference tag
 */
export function getPathCompletionsForAutocomplete(query: GetPathCompletionsForAutocomplete): types.Completion[] {
    const sourceFile = query.project.languageService.getNonBoundSourceFile(query.filePath);
    const positionNode = ts.getTokenAtPosition(sourceFile, query.position);

    const inReferenceTagPath = false;
    const inES6ModuleImportString = isStringLiteralInES6ImportDeclaration(positionNode);
    const inImportRequireString = isStringLiteralInImportRequireDeclaration(positionNode);

    if (!inReferenceTagPath && !inES6ModuleImportString && !inImportRequireString){
        return [];
    }

    var project = query.project;
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.configFile.project.files.filter(p=> p !== query.filePath && !p.endsWith('.json'));
    var files: {
        fileName: string;
        relativePath: string;
        fullPath: string;
    }[] = [];

    if (!inReferenceTagPath) {
        var externalModules = getExternalModuleNames(project.languageService.getProgram());
        externalModules.forEach(e=> files.push({
            fileName: `${e}`,
            relativePath: e,
            fullPath: e
        }));
    }

    filePaths.forEach(p=> {
        files.push({
            fileName: fsu.removeExt(utils.getFileName(p)),
            relativePath: fsu.removeExt(fsu.makeRelativePath(sourceDir, p)),
            fullPath: p
        });
    });

    const sanitizedPrefix = sanitizePrefix(query.prefix);
    const endsInPunctuation: boolean = utils.prefixEndsInPunctuation(sanitizedPrefix);
    if (!endsInPunctuation)
        files = fuzzaldrin.filter(files, sanitizedPrefix, { key: 'fileName' });

    return files.map(f => {
        const result: types.Completion = { pathCompletion: f };
        return result;
    });
}
