export interface API {
    hap: {
        Characteristic: any;
        Service: any;
    };

    on(event:string, handler:Function);
    registerPlatform(pluginName:string, platformName:string, constructor);
}