import { setLog } from "./log.service";
import { AlarmSwitch, PanelSwitch } from "./panel.switch";
import { configure } from "./vivint/config";
import { PanelStatus } from "./vivint/panel.service";

export class VivintPlatform {
    private _accessories: any[];
    constructor(log, config) {
        configure(config);
        setLog(log);

        this._accessories = [
            new PanelSwitch('Alarm Away', PanelStatus.Away),
            new PanelSwitch('Alarm Stay', PanelStatus.Stay),
            new AlarmSwitch('Alarm')
        ];
    }

    accessories(callback) {
        callback(this._accessories);
    }
}