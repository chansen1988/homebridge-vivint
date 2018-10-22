import { Accessory, Characteristic, Service } from "./homebridge/types";
import { panelState, PanelStatus } from "./vivint/panel.service";

export class PanelSwitch {
    private services: any[];
    constructor(public name: string, public onState: PanelStatus) {
        this.services = [
            this.createAccessoryInformation(),
            this.createBridgingStateService(),
            this.createSwitchService()
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

    createSwitchService() {
        let service = new Service.Switch(this.name);

        panelState.subscribe(state => service.getCharacteristic(Characteristic.On).updateValue(this.isOn(state)));

        service.getCharacteristic(Characteristic.On)
            .on('get', async (cb: (error, value) => void) => cb(null, this.isOn(await panelState.get())))
            .on('set', async (value: any, cb: (error) => void) => {
                await this.setIsOn(value);
                cb(null);
            });

        return service;
    }

    getServices() {
        return this.services;
    }

    isOn(state: PanelStatus) {
        return state === this.onState;
    }

    async setIsOn(value: boolean) {
        await panelState.set(value ? this.onState : PanelStatus.Disarmed);
    }
}

export class AlarmSwitch extends PanelSwitch {
    constructor(name: string) {
        super(name, PanelStatus.Stay);
    }

    isOn(state: PanelStatus) {
        return state !== PanelStatus.Disarmed;
    }
}