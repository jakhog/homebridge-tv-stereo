import { API, IndependentPlatformPlugin, Logging, PlatformConfig } from 'homebridge';

import { Communicator } from './serial/communicator';
// import tv from './tv';
import stereo from './stereo'

export class Platform implements IndependentPlatformPlugin {
    constructor(
        logger: Logging,
        config: PlatformConfig,
        api: API)
    {
        // const TV = tv(api);
        const Stereo = stereo(api);

        const communicator = new Communicator('/dev/ttyACM0');

        setInterval(async () => {
            if (!communicator.ready) {
                logger.warn('Power Polling: Communicator not ready');
                return;
            }

            try {
                await communicator.getDenonPowerStatus();
                // await communicator.getSamsungPowerStatus();
            } catch (err) {
                logger.error(`Power Polling: Failed to get power status: ${err}`);
            }
        }, 1000);

        api.publishExternalAccessories('homebridge-plugin-tv-stereo', [
            // new TV(communicator, logger),
            new Stereo(communicator, logger),
        ]);
    }
}