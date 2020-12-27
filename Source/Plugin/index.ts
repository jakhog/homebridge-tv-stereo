import { API } from 'homebridge';

import { Platform } from './platform';

export = (api: API) => {
    api.registerPlatform('homebridge-plugin-tv-stereo', Platform)
}