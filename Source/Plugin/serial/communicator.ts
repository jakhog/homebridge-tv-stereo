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

    constructor(path: string, options = {}) {
        super(options);

        this._transform = new HomebridgeParser();
        this._transform.on('data', (chunk) => this.onMessage(chunk));

        this._arduino = new SerialPort(path, {
            baudRate: 9600,
        }, (err) => {
            if (err) {
                this.emit('error', `Error connecting to serial port: ${err}`);
            }
        });
        this._arduino.on('error', (err) => this.emit('error', err));
        this._arduino.pipe(this._transform);

        this.on('ready', () => this._ready = true);
    }

    private onMessage(chunk: Buffer): void {
        switch (MESSAGE_TYPES[chunk[0]]) {
            case 'text':
                this.onText(chunk.slice(1).toString('ascii'));
                break;
            case 'denon_status_response':
                this.onDenonStatusResponse(chunk[1] === 0x01);
                break;
            case 'samsung_status_response':
                this.onSamsungStatusResponse(chunk[1] === 0x01);
                break;
            default:
                this.emit('error', `Unknown message type ${chunk[0]}`);
        }
    }

    private onText(text: string): void {
        this.emit('text', text);

        if (text === 'READY') this.emit('ready');
        if (text === 'OK') this.emit('ok');
        if (text === 'ERROR') this.emit('error', 'Error handling message');
    }

    private onDenonStatusResponse(isPoweredOn: boolean): void {
        this.emit('denon-power-status', isPoweredOn);
    }

    private onSamsungStatusResponse(isPoweredOn: boolean): void {
        this.emit('samsung-power-status', isPoweredOn);
    }

    private sendData(type: number, data: Buffer): void {
        const chunk = Buffer.alloc(4+data.length);
        chunk[0] = 0x02;
        chunk[1] = type;
        chunk[2] = data.length;
        data.copy(chunk, 3);
        let checksum = type ^ data.length;
        for (const byte of data) {
            checksum ^= byte;
        }
        chunk[3+data.length] = checksum;
        this._arduino.write(chunk);
    }

    private waitForEventOnce<T>(event: string): Promise<T> {
        return new Promise((resolve) => {
            this.once(event, (data: T) => resolve(data));
        });
    }

    private async waitForResultOnce(): Promise<void> {
        const text = await this.waitForEventOnce<string>('text');
        if (text !== 'OK') throw text;
    }

    private async waitForResponseOnce<T>(event: string): Promise<T> {
        let response: T;
        const listener = (data: T) => response = data;
        this.once(event, listener);

        try {
            await this.waitForResultOnce();
            return response!;
        } catch (err) {
            this.off(event, listener);
            throw err;
        }
    }

    waitForReady(): Promise<void> {
        if (this._ready) return Promise.resolve();
        return this.waitForEventOnce<void>('ready');
    }

    get ready(): boolean {
        return this._ready;
    }

    sendText(text: string): Promise<void> {
        this.sendData(0x00, Buffer.from(text, 'ascii'));
        return this.waitForResultOnce();
    }

    sendDenonCommand(device: number, command: number): Promise<void> {
        const data = Buffer.alloc(2);
        data[0] = device;
        data[1] = command;
        this.sendData(0x01, data);
        return this.waitForResultOnce();
    }

    getDenonPowerStatus(): Promise<boolean> {
        this.sendData(0x02, Buffer.alloc(0));
        return this.waitForResponseOnce<boolean>('denon-power-status');
    }

    sendSamsungCommand(data: Buffer): Promise<void> {
        this.sendData(0x04, data);
        return this.waitForResultOnce();
    }

    getSamsungPowerStatus(): Promise<boolean> {
        this.sendData(0x05, Buffer.alloc(0));
        return this.waitForResponseOnce<boolean>('samsung-power-status');
    }
}