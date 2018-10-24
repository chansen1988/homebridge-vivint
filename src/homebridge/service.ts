import { Characteristic } from "./characteristic";

class Service {
    isPrimaryService : boolean;
    getCharacteristic(name:any) : Characteristic {
        return;
    }
    setCharacteristic(name:any, value:any) : Service {
        return this;
    }
}

export const AccessoryInformation = Service;

export const BridgingState = Service;

export class Switch extends Service {
    constructor(name:string) {
        super();
    }
}

export class LockMechanism extends Service {
    constructor(name:string) {
        super();
    }
}