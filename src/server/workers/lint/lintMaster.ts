import * as sw from "../../utils/simpleWorker";
import * as contract from "./lintContract";

import {resolve} from "../../../common/utils";

/** This is were we push the errors */
import {errorsCache} from "../../globalErrorCache";
/** This is where we get the active project information from */
import {projectFilePathsUpdated} from "../../disk/activeProjectConfig";

namespace Master {
    export const receiveErrorCacheDelta: typeof contract.master.receiveErrorCacheDelta
        = (data) => {
            errorsCache.applyDelta(data);
            return resolve({});
        };
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;
// launch worker
export const {worker} = sw.startWorker({
    workerPath: __dirname + '/lintWorker',
    workerContract: contract.worker,
    masterImplementation: Master
});
export function start() {
    projectFilePathsUpdated.on((e)=>worker.activeProjectFilePaths(e));
    // TODO: lint
    // push if any file in the active project changes.
}
