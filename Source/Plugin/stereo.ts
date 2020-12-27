import { Logging, API, Service, CharacteristicValue, CharacteristicSetCallback } from 'homebridge';

import { Communicator } from './serial/communicator';

type InputSource = {
    identifier: number;
    key: string;
    name: string;
    command: number;
}

export default function(api: API) {
    return class Stereo extends api.platformAccessory {
        private readonly _television: Service;
        private readonly _speaker: Service;

        private readonly _inputSources: InputSource[] = [
            { identifier: 1, key: 'cd',     name: 'CD',     command: 196 },
            { identifier: 2, key: 'tuner',  name: 'Tuner',  command: 197 },
            { identifier: 3, key: 'aux',    name: 'AUX',    command: 198 },
            { identifier: 4, key: 'tv',     name: 'TV',     command: 201 },
            { identifier: 5, key: 'vaux',   name: 'V.AUX',  command: 204 },
            { identifier: 6, key: 'vcr',    name: 'VCR',    command: 205 },
            { identifier: 7, key: 'cdr',    name: 'CDR',    command: 210 },
            { identifier: 8, key: 'dvd',    name: 'DVD',    command: 227 },
        ];

        constructor(
            private readonly _communicator: Communicator,
            private readonly _logger: Logging)
        {
            super(
                'Denon AVR-1705',
                api.hap.uuid.generate('homebridge:plugin-tv-stereo:Denon AVR-1705'),
                api.hap.Categories.AUDIO_RECEIVER
            );
            this.category = api.hap.Categories.AUDIO_RECEIVER;

            this._television = this.addService(api.hap.Service.Television);
            this.initializeTelevisionService();
            this.initializeInputSourceServices();

            this._speaker = this.addService(api.hap.Service.TelevisionSpeaker);
            this.initializeSpeakerService();

            this.listenForPowerStatusUpdates();
        }

        private initializeTelevisionService() {
            this._television.setCharacteristic(api.hap.Characteristic.ConfiguredName, 'Denon AVR-1705');
            this._television.setCharacteristic(api.hap.Characteristic.SleepDiscoveryMode, api.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
            this._television.getCharacteristic(api.hap.Characteristic.Active)
                .on('set', (value, callback) => this.onSetActive(value, callback));
            this._television.getCharacteristic(api.hap.Characteristic.ActiveIdentifier)
                .on('set', (value, callback) => this.onSetActiveIdentifier(value, callback));
            this._television.getCharacteristic(api.hap.Characteristic.RemoteKey)
                .on('set', (value, callback) => this.onSetRemoteKey(value, callback));
        }

        private initializeInputSourceServices() {
            for (const source of this._inputSources) {
                const service = this.addService(api.hap.Service.InputSource, source.key, source.name);
                service.setCharacteristic(api.hap.Characteristic.Identifier, source.identifier);
                service.setCharacteristic(api.hap.Characteristic.ConfiguredName, source.name);
                service.setCharacteristic(api.hap.Characteristic.IsConfigured, api.hap.Characteristic.IsConfigured.CONFIGURED);
                service.setCharacteristic(api.hap.Characteristic.InputSourceType, api.hap.Characteristic.InputSourceType.HDMI);
                this._television.addLinkedService(service);
            }
        }

        private initializeSpeakerService() {
            this._speaker.setCharacteristic(api.hap.Characteristic.Active, api.hap.Characteristic.Active.ACTIVE);
            this._speaker.setCharacteristic(api.hap.Characteristic.VolumeControlType, api.hap.Characteristic.VolumeControlType.ABSOLUTE);
            this._speaker.getCharacteristic(api.hap.Characteristic.Mute)
                .on('set', (value, callback) => this.onSetMute(value, callback));
            this._speaker.getCharacteristic(api.hap.Characteristic.VolumeSelector)
                .on('set', (value, callback) => this.onSetVolumeSelector(value, callback));
            this._speaker.getCharacteristic(api.hap.Characteristic.Volume)
                .on('set', (value, callback) => this.onSetVolume(value, callback));
        }

        private listenForPowerStatusUpdates() {
            this._television.setCharacteristic(api.hap.Characteristic.Active, api.hap.Characteristic.Active.INACTIVE);
            this._communicator.on('denon-power-status', (isOn: boolean) => {
                const value = isOn ? api.hap.Characteristic.Active.ACTIVE : api.hap.Characteristic.Active.INACTIVE;
                this._television.updateCharacteristic(api.hap.Characteristic.Active, value);
            });
        }

        private onSetActive(value: CharacteristicValue, callback: CharacteristicSetCallback) {
            if (typeof value !== 'number') {
                this._logger.error(`Stereo: Active value was not 'number', got: ${value}`);
                callback(new Error('Active value was not "number"'));
                return;
            }

            if (!this._communicator.ready) {
                this._logger.warn('Stereo: Communicator is not ready');
                callback(new Error('Communicator not ready'));
                return;
            }

            this._communicator.sendDenonCommand(2, 226 - value)
                .then(() => {
                    this._television.updateCharacteristic(api.hap.Characteristic.Active, value);
                    callback(null);
                })
                .catch((err) => callback(err));
        }

        private onSetActiveIdentifier(value: CharacteristicValue, callback: CharacteristicSetCallback) {
            if (typeof value !== 'number') {
                this._logger.error(`Stereo: ActiveIdentifier value was not 'number', got: ${value}`);
                callback(new Error('ActiveIdentifier value was not "number"'));
                return;
            }

            const source = this._inputSources.find(_ => _.identifier === value);
            if (source === undefined) {
                this._logger.error(`Stereo: ActiveIdentifier value was not a valid input source, got: ${value}`);
                callback(new Error('ActiveIdentifier value was not a valid input source'));
                return;
            }

            if (!this._communicator.ready) {
                this._logger.warn('Stereo: Communicator is not ready');
                callback(new Error('Communicator not ready'));
                return;
            }

            this._communicator.sendDenonCommand(2, source.command)
                .then(() => {
                    this._television.updateCharacteristic(api.hap.Characteristic.ActiveIdentifier, value);
                    callback(null);
                })
                .catch((err) => callback(err));
        }

        private onSetRemoteKey(value: CharacteristicValue, callback: CharacteristicSetCallback) {
            this._logger.warn(`Stereo: RemoteKey is not implemented, got Set RemoteKey = ${value}`);
            callback(null);
        }

        private onSetMute(value: CharacteristicValue, callback: CharacteristicSetCallback) {
            this._logger.warn(`Stereo: Mute is not implemented, got Set Mute = ${value}`);
            callback(null);
        }

        private onSetVolumeSelector(value: CharacteristicValue, callback: CharacteristicSetCallback) {
            if (typeof value !== 'number') {
                this._logger.error(`Stereo: VolumeSelector value was not 'number', got: ${value}`);
                callback(new Error('VolumeSelector value was not "number"'));
                return;
            }

            if (!this._communicator.ready) {
                this._logger.warn('Stereo: Communicator is not ready');
                callback(new Error('Communicator not ready'));
                return;
            }

            this._communicator.sendDenonCommand(2, 241 + value)
                .then(() => callback(null))
                .catch((err) => callback(err));
        }

        private onSetVolume(value: CharacteristicValue, callback: CharacteristicSetCallback) {
            this._logger.warn(`Stereo: Volume is not implemented, got Set Volume = ${value}`);
            callback(null);
        }
    }
};