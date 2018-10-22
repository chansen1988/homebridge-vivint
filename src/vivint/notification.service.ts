import * as PubNub from 'pubnub';
import * as request from 'request-promise-native';
import { log } from '../log.service';
import { getToken } from "./auth.service";
import { API, USER_AGENT } from "./config";

let _getChannelId: Promise<string>;
function getChannelId() {
    if (!_getChannelId) {
        _getChannelId = (async function () {
            let token = await getToken();

            log('Getting Channel ID');
            let resp = await request.get(`${API.url}/api/authuser`, {
                headers: {
                    Authorization: token,
                    'User-Agent': USER_AGENT
                },
                json: true
            });

            log(`Channel ID: ${resp.u.mbc}`);
            return resp.u.mbc;
        })();
    }
    return _getChannelId;
}

let _getSubscribeKey: Promise<string>;
function getSubscribeKey() {
    if (!_getSubscribeKey) {
        _getSubscribeKey = (async function () {
            log(`Getting Vivint Subscribe Key from ${API.url}`);
            let script: string = await request.get(`${API.url}/app/scripts/app.js`);

            let key = /o\s*=\s*"(sub-c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/ig.exec(script)[1];
            log(`Vivint Subscribe Key: ${key}`);

            return key;
        })();
    }
    return _getSubscribeKey;
}

let _subscribe: Promise<PubNub>;
function subscribe() {
    if (!_subscribe) {
        _subscribe = new Promise(async resolve => {
            let channelId = await getChannelId();
            let subscribeKey = await getSubscribeKey();

            log(`Subscribing to Platform Channel: ${channelId}`);
            let pubnub = new PubNub({
                subscribeKey: subscribeKey,
                ssl: true
            });
            pubnub.subscribe({ channels: [`PlatformChannel#${channelId}`] });
            
            resolve(pubnub);
        });
    }
    return _subscribe;
}

export async function addListener(cb: (message) => void) {
    let lastTimestamp = 0;
    let listener: PubNub.ListenerParameters = {
        message(e) {
            try {
                let timestamp = e.message.da.plctx.validation.timestamp;
                if (timestamp > lastTimestamp) {
                    log(`Notification Message Received: ${e.channel}`);
                    cb(e.message);
                    lastTimestamp = timestamp;
                }
            } catch { }
        }
    };

    (await subscribe()).addListener(listener);

    return listener;
}

export async function removeListener(listener: PubNub.ListenerParameters) {
    (await subscribe()).removeListener(listener);
}

export async function stopNotifications() {
    if (_subscribe) {
        log('Stopping PubNub Notifications');
        (await _subscribe).stop();
    }
}