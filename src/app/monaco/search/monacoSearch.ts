/**
 * The best way to understand what is going on is to review the `find` module in monaco
 * https://github.com/Microsoft/vscode/tree/385412e89f610aaa5dc7d6a3727f45e048e37c7e/src/vs/editor/contrib/find
 */
/** Some types */
type Editor = monaco.editor.ICommonCodeEditor;

/**
 * Mostly providing a typed API on top of `search`
 */
export let commands = {
    search: (cm: Editor, query: FindOptions) => startSearch(cm, getSearchState(cm), query),
    hideSearch: (cm: Editor) => hideSearch(cm),
    findNext: (cm: Editor, query: FindOptions) => findNextIfNotAlreadyDoing(cm, query, false),
    findPrevious: (cm: Editor, query: FindOptions) => findNextIfNotAlreadyDoing(cm, query, true),
    replaceNext: (cm: Editor, newText: string) => simpleReplace(cm, newText, false),
    replacePrevious: (cm: Editor, newText: string) => simpleReplacePrevious(cm, newText),
    replaceAll: (cm: Editor, newText: string) => simpleReplace(cm, newText, true),
}

/** TODO: mon */
const getSearchState: any = () => null;
const startSearch: any = () => null;
const hideSearch: any = () => null;
const findNextIfNotAlreadyDoing: any = () => null;
const simpleReplace: any = () => null;
const simpleReplacePrevious: any = () => null;
