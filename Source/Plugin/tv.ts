// import { API, CharacteristicSetCallback, CharacteristicValue, Logging, Service } from 'homebridge';

// import { Communicator } from './serial/communicator';

// type InputSource = {
//     identifier: number;
//     key: string;
//     name: string;
//     command: [number, number];
// }

// export default function(api: API) {
//     return class TV extends api.platformAccessory {
//         private readonly _television: Service;

//         private readonly _inputSources: InputSource[] = [
//             { identifier: 1, key: 'tv',         name: 'TV',         command: [0x00, 0x00] },
//             { identifier: 2, key: 'av',         name: 'AV',         command: [0x01, 0x00] },
//             { identifier: 3, key: 'component',  name: 'Component',  command: [0x03, 0x00] },
//             { identifier: 4, key: 'pc',         name: 'PC',         command: [0x04, 0x00] },
//             { identifier: 5, key: 'hdmi1',      name: 'HDMI1',      command: [0x05, 0x00] },
//             { identifier: 6, key: 'hdmi2',      name: 'HDMI2',      command: [0x05, 0x01] },
//             { identifier: 7, key: 'hdmi3',      name: 'HDMI3',      command: [0x05, 0x02] },
//             { identifier: 8, key: 'hdmi4',      name: 'HDMI4',      command: [0x05, 0x03] },
//         ];

//         constructor(
//             private readonly _communicator: Communicator,
//             private readonly _logger: Logging)
//         {
//             super(
//                 'Samsung UE46C5105',
//                 api.hap.uuid.generate('homebridge:plugin-tv-stereo:Samsung UE46C5105'),
//                 api.hap.Categories.TELEVISION
//             );
//             this.category = api.hap.Categories.TELEVISION;

//             this._television = this.addService(api.hap.Service.Television);
//             this.initializeTelevisionService();
//             this.initializeInputSourceServices();

//             this.listenForPowerStatusUpdates();
//         }

//         private initializeTelevisionService() {
//             this._television.setCharacteristic(api.hap.Characteristic.ConfiguredName, 'Samsung UE46C5105');
//             this._television.setCharacteristic(api.hap.Characteristic.SleepDiscoveryMode, api.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
//             this._television.getCharacteristic(api.hap.Characteristic.Active)
//                 .on('set', (value, callback) => this.onSetActive(value, callback));
//             this._television.getCharacteristic(api.hap.Characteristic.ActiveIdentifier)
//                 .on('set', (value, callback) => this.onSetActiveIdentifier(value, callback));
//             this._television.getCharacteristic(api.hap.Characteristic.RemoteKey)
//                 .on('set', (value, callback) => this.onSetRemoteKey(value, callback));
//         }

//         private initializeInputSourceServices() {
//             for (const source of this._inputSources) {
//                 const service = this.addService(api.hap.Service.InputSource, source.key, source.name);
//                 service.setCharacteristic(api.hap.Characteristic.Identifier, source.identifier);
//                 service.setCharacteristic(api.hap.Characteristic.ConfiguredName, source.name);
//                 service.setCharacteristic(api.hap.Characteristic.IsConfigured, api.hap.Characteristic.IsConfigured.CONFIGURED);
//                 service.setCharacteristic(api.hap.Characteristic.InputSourceType, api.hap.Characteristic.InputSourceType.HDMI);
//                 this._television.addLinkedService(service);
//             }
//         }

//         private listenForPowerStatusUpdates() {
//             this._television.setCharacteristic(api.hap.Characteristic.Active, api.hap.Characteristic.Active.INACTIVE);
//             this._communicator.on('samsung-power-status', (isOn: boolean) => {
//                 const value = isOn ? api.hap.Characteristic.Active.ACTIVE : api.hap.Characteristic.Active.INACTIVE;
//                 this._television.updateCharacteristic(api.hap.Characteristic.Active, value);
//             });
//         }

//         private onSetActive(value: CharacteristicValue, callback: CharacteristicSetCallback) {
//             if (typeof value !== 'number') {
//                 this._logger.error(`TV: Active value was not 'number', got: ${value}`);
//                 callback(new Error('Active value was not "number"'));
//                 return;
//             }

//             if (!this._communicator.ready) {
//                 this._logger.warn('TV: Communicator is not ready');
//                 callback(new Error('Communicator not ready'));
//                 return;
//             }

//             this._communicator.sendSamsungCommand(Buffer.from([0x00, 0x00, 0x00, 0x01 + value]))
//                 .then(() => {
//                     this._television.updateCharacteristic(api.hap.Characteristic.Active, value);
//                     callback(null);
//                 })
//                 .catch((err) => callback(err));
//         }

//         private onSetActiveIdentifier(value: CharacteristicValue, callback: CharacteristicSetCallback) {
//             if (typeof value !== 'number') {
//                 this._logger.error(`TV: ActiveIdentifier value was not 'number', got: ${value}`);
//                 callback(new Error('ActiveIdentifier value was not "number"'));
//                 return;
//             }

//             const source = this._inputSources.find(_ => _.identifier === value);
//             if (source === undefined) {
//                 this._logger.error(`TV: ActiveIdentifier value was not a valid input source, got: ${value}`);
//                 callback(new Error('ActiveIdentifier value was not a valid input source'));
//                 return;
//             }

//             if (!this._communicator.ready) {
//                 this._logger.warn('TV: Communicator is not ready');
//                 callback(new Error('Communicator not ready'));
//                 return;
//             }

//             this._communicator.sendSamsungCommand(Buffer.from([0x0a, 0x00, ...source.command]))
//                 .then(() => {
//                     this._television.updateCharacteristic(api.hap.Characteristic.ActiveIdentifier, value);
//                     callback(null);
//                 })
//                 .catch((err) => callback(err));
//         }

//         private onSetRemoteKey(value: CharacteristicValue, callback: CharacteristicSetCallback) {
//             this._logger.warn(`TV: RemoteKey is not implemented, got Set RemoteKey = ${value}`);
//             callback(null);
//         }
//     }
// }