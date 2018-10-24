export abstract class Characteristic {
    static readonly AccessoryIdentifier: string;
    static readonly Category: string;
    static readonly LinkQuality: string;
    static readonly LockCurrentState: {
        SECURED: string;
        UNSECURED: string;
    };
    static readonly LockTargetState: string;
    static readonly Manufacturer: string;
    static readonly Model: string;
    static readonly Name: string;
    static readonly On: string;
    static readonly Reachable: string;

    abstract on(event: 'get', handler: (callback: (error: any, value: any) => void) => void): Characteristic;
    abstract on(event: 'set', handler: (value: any, callback: (error: any) => void) => void): Characteristic;

    abstract updateValue(value: any): Characteristic;
}