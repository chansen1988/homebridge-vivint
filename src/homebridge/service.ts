import { Characteristic } from "./characteristic";

class Service {
    isPrimaryService : boolean;
    getCharacteristic(name:string) : Characteristic {
        return;
    }
    setCharacteristic(name:string, value:any) : Service {
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