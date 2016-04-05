import {TypedEvent} from "../../common/events";
import {createMapByKey, debounce, selectMany} from "../../common/utils";
import equal = require('deep-equal');

type FilePathErrorsUpdate = {
    filePath: string;
    errors: CodeError[];
}

type ErrorCacheDelta = {
    added: FilePathErrorsUpdate[];
    removed: FilePathErrorsUpdate[];
}

/**
 * Maintains the list of errors that have been encountered,
 * and notifies anyone who is concerned of updated values
 */
export class ErrorsCache {

    /**
     * For a lazy view of the current state. Note: this is throttled + limited for performance
     */
    public errorsUpdated = new TypedEvent<LimitedErrorsUpdate>();

    /**
     * Events that can be wired up to sync one error cache with another
     */
    public errorsDelta = new TypedEvent<ErrorCacheDelta>();

    /**
     * You can wire up an errors Delta from one cache to this one.
     */
    public applyDelta = (delta:ErrorCacheDelta) => {
        // TODO:
        this.errorsDelta.emit(delta);
    }

    /**
     * current errors
     */
    private _errorsByFilePath: ErrorsByFilePath = {};

    /**
     * debounced as constantly sending errors quickly degrades the web experience
     */
    private sendErrors = debounce(() => {
        this.errorsUpdated.emit(this.getErrorsLimited());
    }, 250);

    /** The pased errors are considered *the only current* errors for the filePath */
    public setErrorsByFilePaths = (filePaths: string[], errors: CodeError[]) => {
        let somethingNew = false;

        // For all found errors add them
        let errorsByFile = createMapByKey(errors, (e) => e.filePath);
        for (let filePath in errorsByFile) {
            if (!equal(this._errorsByFilePath[filePath], errorsByFile[filePath])) {
                somethingNew = true;
                this._errorsByFilePath[filePath] = errorsByFile[filePath];
            }
        }

        // For not found errors clear them
        for (let filePath of filePaths) {
            if (!errorsByFile[filePath] && (this._errorsByFilePath[filePath] && this._errorsByFilePath[filePath].length)) {
                somethingNew = true;
                this._errorsByFilePath[filePath] = [];
            }
        }

        if (somethingNew) {
            this.sendErrors();
        }
    }

    /**
     * * Sending massive error lists *constantly* can quickly degrade the web experience
     * - only send 50 errors per file or 200+ errors total
     */
    public getErrorsLimited = (): LimitedErrorsUpdate => {
        let limitedCopy: ErrorsByFilePath = {};
        let total = 0;
        for (let filePath in this._errorsByFilePath) {
            let errors = this._errorsByFilePath[filePath];
            if (errors.length > 50) errors = errors.slice(0, 50);
            limitedCopy[filePath] = errors;
            total += errors.length;
            if (total > 200) break;
        }
        const totalCount = Object.keys(this._errorsByFilePath)
            .map(x => this._errorsByFilePath[x].length)
            .reduce((acc, i) => acc + i, 0);
        return { errorsByFilePath: limitedCopy, totalCount, syncCount: total, tooMany: total !== totalCount };
    }

    /**
     * Clear all errors. Resets the cache.
     */
    public clearErrors = () => {
        this._errorsByFilePath = {};
        this.sendErrors();
    }

    /** Utility to provide a semantic name to *clearing errors*  */
    public clearErrorsForFilePath = (filePath: string) => {
        this._errorsByFilePath[filePath] = [];
        this.sendErrors();
    }

    /** Utility to query */
    public getErrorsForFilePath = (filePath: string) => {
        return this._errorsByFilePath[filePath] || [];
    }
}
