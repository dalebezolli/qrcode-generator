class DataBuffer {
	constructor(size) {
		this.buffer = new Uint8Array(size);
		this.length = 0;
	}

	readBit(pos) {
		const byteIndex = Math.floor(pos / 8);
		return (this.buffer[byteIndex] >>> (7 - (pos) % 8)) & 1;
	}

	push(data, length) {
		for(let bitIndex = 0; bitIndex < length; bitIndex++) {
			const dataBufferIndex = Math.floor(this.length / 8);
			const bit = (data >>> (length - bitIndex - 1)) & 1;
			if(bit) this.buffer[dataBufferIndex] |= 0b1000_0000 >>> (this.length % 8);
			this.length++;
		}
	}
}

export {DataBuffer};