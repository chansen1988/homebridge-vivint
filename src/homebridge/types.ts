import * as _Accessory from './accessory';
import * as _Characteristic from './characteristic';
import * as _Service from './service';

export let Accessory = _Accessory;
export let Characteristic = _Characteristic.Characteristic;
export let Service = _Service;

export function setTypes(hap) {
    Accessory = hap.Accessory;
    Characteristic = hap.Characteristic;
    Service = hap.Service;
}