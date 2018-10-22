import { API } from "./homebridge/api";
import { setTypes } from "./homebridge/types";
import { VivintPlatform } from "./platform";
import { stopNotifications } from "./vivint/notification.service";

module.exports = (homebridge: API) => {
    setTypes(homebridge.hap);

    homebridge.on('shutdown', () => stopNotifications());
    homebridge.registerPlatform('homebridge-vivint', 'Vivint', VivintPlatform);
};