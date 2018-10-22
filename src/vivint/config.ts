export const API = {
    url: 'https://www.vivintsky.com'
};

export const AUTH = {
    password: '',
    url: 'https://id.vivint.com',
    username: ''
};

export const USER_AGENT = 'homebridge-vivint.vivint.service';

export function configure(config) {
    AUTH.password = config.password;
    AUTH.username = config.username;
}