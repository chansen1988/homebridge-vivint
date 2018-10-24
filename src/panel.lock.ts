import { Accessory, Characteristic, Service } from "./homebridge/types";
import { panelState, PanelStatus } from "./vivint/panel.service";

export class PanelLock {
    private services: any[];
    constructor(public name: string) {
        this.services = [
            this.createAccessoryInformation(),
            this.createBridgingStateService(),
            this.createLockService()
        ];
    }

    private createAccessoryInformation() {
        return new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Name, this.name)
            .setCharacteristic(Characteristic.Manufacturer, 'Vivint')
            .setCharacteristic(Characteristic.Model, 'Sky Control');
    }

    private createBridgingStateService() {
        return new Service.BridgingState()
            .setCharacteristic(Characteristic.Reachable, true)
            .setCharacteristic(Characteristic.LinkQuality, 4)
            .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
            .setCharacteristic(Characteristic.Category, Accessory.Categories.SWITCH);
    }

    createLockService() {
        let service = new Service.LockMechanism(this.name);

        panelState.subscribe(state => service.getCharacteristic(Characteristic.LockCurrentState).updateValue(this.getLockState(state)));

        service.getCharacteristic(Characteristic.LockTargetState)
            .on('get', async (cb: (error, value) => void) => cb(null, this.getLockState(await panelState.get())))
            .on('set', async (value: any, cb: (error) => void) => {
                await panelState.set(value === Characteristic.LockCurrentState.SECURED ? PanelStatus.Stay : PanelStatus.Disarmed);
                cb(null);
            });

        return service;
    }

    getServices() {
        return this.services;
    }

    getLockState(state: PanelStatus) {
        return state === PanelStatus.Disarmed ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED;
    }
}