class DataMatrix {
	constructor(size) {
		this.matrix = new Array(size * size);
		this.maskable = new Array(size * size);
		this.size = size;
	}

	set(row, column, value, maskable) {
		const index = row * this.size + column;
		this.matrix[index] = value;
		this.maskable[index] = maskable;
	}

	get(row, column) {
		return this.matrix[row * this.size + column];
	}

	isMaskable(row, column) {
		return this.maskable[row * this.size + column];
	}
}

export {DataMatrix}