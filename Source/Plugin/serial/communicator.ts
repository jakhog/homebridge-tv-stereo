import { EventEmitter } from 'events';
import { Transform } from 'stream';
import { Buffer } from 'buffer';
import SerialPort from 'serialport';

import { HomebridgeParser } from './parser';
import { rejects } from 'assert';

const MESSAGE_TYPES = [
    'text',
    'denon_command',
    'denon_status_request',
    'denon_status_response',
    'samsung_command',
    'samsung_status_request',
    'samsung_status_response'
];

export class Communicator extends EventEmitter {
    private readonly _transform: Transform;
    private readonly _arduino: SerialPort;
    private _ready: boolean = false;
    private _nextRequestId: number = 0;

    constructor(path: string, options = {}) {
        super(options);

        this._transform = new HomebridgeParser();
        this._transform.on('data', (chunk) => this.onMessage(chunk));

        this._arduino = new SerialPort(path, {
            baudRate: 115200,
        }, (err) => {
            if (err) {
                this.emit('error', `Error connecting to serial port: ${err}`);
            }
        });
        this._arduino.on('error', (err) => this.emit('error', err));
        this._arduino.pipe(this._transform);

        this.on('ready', () => this._ready = true);
        this.sendData(0x00, Buffer.from('READY?', 'ascii'));
    }

    private onMessage(chunk: Buffer): void {
        const id = chunk[1];
        switch (MESSAGE_TYPES[chunk[0]]) {
            case 'text':
                this.onText(id, chunk.slice(2).toString('ascii'));
                break;
            case 'denon_status_response':
                this.onDenonStatusResponse(id, chunk[2] === 0x01);
                break;
            case 'samsung_status_response':
                this.onSamsungStatusResponse(id, chunk[2] === 0x01);
                break;
            default:
                this.emit('error', `Unknown message type ${chunk[0]}`);
        }
    }

    private onText(id: number, text: string): void {
        this.emit('text', text, id);

        if (text === 'READY') this.emit('ready');
        if (text === 'OK') this.emit('ok');
        if (text === 'ERROR') this.emit('error', 'Error handling message');
    }

    private onDenonStatusResponse(id: number, isPoweredOn: boolean): void {
        this.emit('denon-power-status', isPoweredOn, id);
    }

    private onSamsungStatusResponse(id: number, isPoweredOn: boolean): void {
        this.emit('samsung-power-status', isPoweredOn, id);
    }

    private sendData(type: number, data: Buffer): number {
        const id = this._nextRequestId;
        this._nextRequestId++;
        if (this._nextRequestId > 255) this._nextRequestId = 1;

        const chunk = Buffer.alloc(5+data.length);
        chunk[0] = 0x02;
        chunk[1] = type;
        chunk[2] = id;
        chunk[3] = data.length;
        data.copy(chunk, 4);
        
        let checksum = type ^ id ^ data.length;
        for (const byte of data) {
            checksum ^= byte;
        }
        chunk[4+data.length] = checksum;
        
        this._arduino.write(chunk);
        return id;
    }

    private waitForEvent<T>(id: number, event: string): Promise<T> {
        return new Promise((resolve) => {
            const listener = (data: T, eid: number) => {
                if (eid === id) {
                    this.off(event, listener);
                    resolve(data);
                }
            };
            this.on(event, listener);
        });
    }

    private async waitForResult(id: number): Promise<void> {
        const text = await this.waitForEvent<string>(id, 'text');
        if (text !== 'OK') throw text;
    }

    private async waitForResponse<T>(id: number, event: string): Promise<T | undefined> {
        let response: T | undefined;
        const listener = (data: T, eid: number) => {
            if (eid === id) {
                response = data;
            }
            this.off(event, listener);
        }
        this.on(event, listener);

        try {
            await this.waitForResult(id);
            return response;
        } catch (err) {
            this.off(event, listener);
            throw err;
        }
    }

    waitForReady(): Promise<void> {
        if (this._ready) return Promise.resolve();
        return new Promise((resolve) => {
            this.once('ready', () => resolve());
        });
    }

    get ready(): boolean {
        return this._ready;
    }

    sendText(text: string): Promise<void> {
        const id = this.sendData(0x00, Buffer.from(text, 'ascii'));
        return this.waitForResult(id);
    }

    sendDenonCommand(device: number, command: number): Promise<void> {
        const data = Buffer.alloc(2);
        data[0] = device;
        data[1] = command;
        const id = this.sendData(0x01, data);
        return this.waitForResult(id);
    }

    async getDenonPowerStatus(): Promise<boolean> {
        const id = this.sendData(0x02, Buffer.alloc(0));
        return await this.waitForResponse<boolean>(id, 'denon-power-status') || false;
    }

    sendSamsungCommand(data: Buffer): Promise<void> {
        const id = this.sendData(0x04, data);
        return this.waitForResult(id);
    }

    async getSamsungPowerStatus(): Promise<boolean> {
        const id = this.sendData(0x05, Buffer.alloc(0));
        return await this.waitForResponse<boolean>(id, 'samsung-power-status') || false;
    }
}