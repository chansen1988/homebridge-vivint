let _log : (message:any) => void = msg => console.log(msg);

export function log(message:any) {
    _log(message);
}

export function setLog(log:(message:any) => void) {
    _log = log;
}