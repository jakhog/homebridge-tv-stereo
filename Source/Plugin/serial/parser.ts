import { Transform, TransformCallback } from 'stream';
import { Buffer } from 'buffer';

export class HomebridgeParser extends Transform {
    private _buffer: Buffer;

    constructor(options = {}) {
        super(options)
        this._buffer = Buffer.alloc(0);
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
        this._buffer = Buffer.concat([this._buffer, Buffer.from(chunk, encoding)])
        while (true) {
            this.cleanBuffer();
            if (this.hasFullMessage) {
                this.decodeMessage();
            } else {
                break;
            }
        }
        callback(null);
    }

    private cleanBuffer(): void {
        if (this._buffer[0] !== 0x02) {
            const start = this._buffer.indexOf(0x02);
            if (start < 0) {
                this._buffer = Buffer.alloc(0);
            } else {
                this._buffer = this._buffer.slice(start);
            }
        }
    }

    private decodeMessage(): void {
        const type = this._buffer[1];
        const length = this._buffer[2];
        const data = this._buffer.slice(3, 3+length);
        const receivedChecksum = this._buffer[3+length];

        let checksum = type ^ length;
        for (const byte of data) {
            checksum ^= byte;
        }

        if (checksum === receivedChecksum) {
            this.push(Buffer.concat([this._buffer.slice(1,2), data]));
        }

        this._buffer = this._buffer.slice(4+length);
    }

    private get hasFullMessage(): boolean {
        if (this._buffer.length < 4) return false;
        if (this._buffer[0] != 0x02) return false;
        if (this._buffer.length < 4+this._buffer[2]) return false;
        return true;
    }
}