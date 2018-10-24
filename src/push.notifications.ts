import { post } from 'request-promise-native';
import { panelState, PanelStatus } from "./vivint/panel.service";

interface IConfig {
    pushedAppKey: string;
    pushedAppSecret: string;
}

export function startPushNotifications(config:IConfig) {
    return panelState.subscribe(async state => {
        let status = 'disarmed';
        if (state === PanelStatus.Away) {
            status = 'armed for away';
        } else if (state === PanelStatus.Stay) {
            status = 'armed for stay';
        }
        await post('https://api.pushed.co/1/push', {
            body: {
                app_key: config.pushedAppKey,
                app_secret: config.pushedAppSecret,
                target_type: 'app',
                content: `is ${status}`
            },
            json: true
        });
    });
}