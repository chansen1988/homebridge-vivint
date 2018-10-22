import * as request from 'request-promise-native';
import { Subject } from 'rxjs';
import { log } from '../log.service';
import { getToken } from './auth.service';
import { API, USER_AGENT } from './config';
import { addListener } from './notification.service';

export enum PanelStatus {
    Away = 4,
    Disarmed = 0,
    Stay = 3
};

let _getPanelId: Promise<Number>;
export function getPanelId() {
    if (!_getPanelId) {
        _getPanelId = (async function () {
            let token = await getToken();

            log('Getting Panel ID');
            let resp = await request.get(`${API.url}/api/authuser`, {
                headers: {
                    Authorization: token,
                    'User-Agent': USER_AGENT
                },
                json: true
            });

            log(`Panel ID: ${resp.u.system[0].panid}`);
            return resp.u.system[0].panid;
        })();
    }
    return _getPanelId;
}

let _getPanelState: Promise<PanelStatus>;
let _panelStateSubject: Subject<PanelStatus>;

export const panelState = {
    get() {
        if (!_getPanelState) {
            _getPanelState = (async function () {
                let panelId = await getPanelId();
                let token = await getToken();

                log(`Getting Panel State: ${panelId}`);
                let resp = await request.get(`${API.url}/api/systems/${panelId}`, {
                    headers: {
                        Authorization: token,
                        'User-Agent': USER_AGENT
                    },
                    json: true
                });

                _getPanelState = undefined;
                return resp.system.par[0].s;
            })();
        }
        return _getPanelState;
    },
    async set(state: PanelStatus) {
        let panelId = await getPanelId();
        let token = await getToken();

        log(`Setting Panel State: ${panelId} to ${state}`);
        await request.put(`${API.url}/api/${panelId}/1/armedstates`, {
            body: {
                armState: state,
                forceArm: false,
                partitionId: 1,
                systemId: panelId
            },
            headers: {
                Authorization: token,
                'User-Agent': USER_AGENT
            },
            json: true
        });
    },
    async subscribe(cb: (state: PanelStatus) => void) {
        if (!_panelStateSubject) {
            _panelStateSubject = new Subject<PanelStatus>();

            await addListener(m => {
                let msg: {
                    args: {
                        name: string[];
                        value: any[];
                    };
                    method: string[];
                    module: string[];
                } = m.da.plctx.validation;

                if (msg.module[0] === 'security_service' && msg.method[0] === 'on_property_updated' && msg.args.name[0] === 'security_state') {
                    log(`Panel State Notification: ${msg.args.value[0]}`);
                    _panelStateSubject.next(msg.args.value[0]);
                }
            });
        }

        _panelStateSubject.subscribe(cb);
        _panelStateSubject.next(await panelState.get());
    }
};