import * as random from 'crypto-random-string';
import { parse } from 'querystring';
import * as request from 'request-promise-native';
import { log } from '../log.service';
import { API, AUTH, USER_AGENT } from './config';

interface IOpenIdConfig {
    token_delegate_endpoint: string;
}

interface IToken {
    expiration: Date;
    token: string;
}

class AuthService {
    private _token: IToken;
    async getToken() {
        if (!this._token) {
            log('Initial Vivint Login');
            this._token = await this.login();
        } else if (this._token.expiration <= new Date()) {
            log('Expired Token');
            this._token = await this.refresh();
        }

        log(`Token Expiration: ${this._token.expiration}`);
        return `Bearer ${this._token.token}`;
    }

    private cookies = request.jar();

    private _clientId: Promise<string>;
    private getClientId() {
        if (!this._clientId) {
            this._clientId = (async function () {
                log(`Getting Vivint Client ID from ${API.url}`);
                let script: string = await request.get(`${API.url}/app/scripts/app.js`);

                let clientId = /r\s*=\s*"id_token",\s*a\s*=\s*"([^"]+)"/ig.exec(script)[1];
                log(`Vivint Client ID: ${clientId}`);

                return clientId;
            })();
        }
        return this._clientId;
    }

    private _openIdConfig: Promise<IOpenIdConfig>;
    private getOpenIdConfig() {
        if (!this._openIdConfig) {
            this._openIdConfig = (async function () {
                log(`Getting OpenID Configuration: ${API.url}`);
                return <IOpenIdConfig>await request.get(`${API.url}/api/openid-configuration`, { json: true });
            })();
        }
        return this._openIdConfig;
    }

    private _login: Promise<IToken>;
    private login() {
        if (!this._login) {
            this._login = new Promise(async resolve => {
                this.cookies = request.jar();

                log(`Getting Login Form: ${AUTH.url}`);
                let response: request.FullResponse = await request.get(`${AUTH.url}/as/authorization.oauth2`, {
                    headers: {
                        Referrer: `${API.url}/app/`,
                        'User-Agent': USER_AGENT
                    },
                    jar: this.cookies,
                    qs: {
                        client_id: await this.getClientId(),
                        pfidpadapterid: 'vivintidp1',
                        nonce: random(32),
                        redirect_uri: `${API.url}/app/`,
                        response_type: 'id_token',
                        scope: 'openid email',
                        state: `replay:${random(32)}`
                    },
                    resolveWithFullResponse: true
                });

                let loginUrl = `${AUTH.url}${/"(\/as\/[^\/]*\/resume\/as\/authorization.ping)"/g.exec(response.body)[1]}`;
                log(`Logging into ${loginUrl}`);
                response = await request.post(loginUrl, {
                    followRedirect: false,
                    form: {
                        'pf.username': AUTH.username,
                        'pf.pass': AUTH.password
                    },
                    headers: {
                        Accept: 'text/html',
                        'Accept-Encoding': 'gzip, deflate',
                        Referrer: response.request.uri.href,
                        'User-Agent': USER_AGENT
                    },
                    jar: this.cookies,
                    qs: {
                        redirect_uri: `${API.url}/app/`
                    },
                    resolveWithFullResponse: true,
                    simple: false,
                    useQuerystring: true
                });

                this._login = undefined;
                resolve(this.parse(parse(response.headers.location.split('#')[1])));
            });
        }
        return this._login;
    }

    private parse(params): IToken {
        let payload = JSON.parse(Buffer.from(params.id_token.split(/\./g)[1], 'base64').toString('ascii'));
        return {
            expiration: new Date((payload.exp - 300) * 1000),
            token: params.id_token
        };
    }

    private _refresh: Promise<IToken>;
    private refresh() {
        if (!this._refresh) {
            this._refresh = new Promise(async resolve => {
                log('Refreshing Authentication Token');
                let response: request.FullResponse = await request.get((await this.getOpenIdConfig()).token_delegate_endpoint, {
                    jar: this.cookies,
                    json: true,
                    qs: {
                        client_id: await this.getClientId(),
                        pfidpadapterid: 'vivintidp1',
                        nonce: random(32),
                        redirect_uri: `${API.url}/app/`,
                        response_type: 'id_token',
                        scope: 'openid email',
                        state: `replay:${random(32)}`
                    },
                    resolveWithFullResponse: true,
                    simple: false
                });

                let token: IToken;
                if (response.statusCode == 200) {
                    token = this.parse(response.body);
                } else {
                    token = await this.login();
                }

                this._refresh = undefined;
                resolve(token);
            });
        }
        return this._refresh;
    }
}

export const authService = new AuthService();
export function getToken() { return authService.getToken(); }