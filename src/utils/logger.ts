import { LOG } from "./config";

const log = (...args:any[]) => {
    if (Number(LOG) === 1) {
        console.log(...args);
    }
}

const Logger = {
    log
}

export default Logger;