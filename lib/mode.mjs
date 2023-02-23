const CHARACTER_COUNT_BIT_LENGTH = new Map([
	[0b0010, [9, 11, 13]],
	[0b0100, [8, 16, 16]]
]);

function getBestMode(data) {
	const alnumRegex = new RegExp('^[A-Z0-9 $%*+-.\/:]*$', 'g');
	if(alnumRegex.test(data)) {
		return 0b0010;
	} else {
		return 0b0100;
	}
}

function getCharacterCountBitLength(version, mode) {
	if(version < 10) {
		return CHARACTER_COUNT_BIT_LENGTH.get(mode)[0];
	} else if(version < 27) {
		return CHARACTER_COUNT_BIT_LENGTH.get(mode)[1];
	} else {
		return CHARACTER_COUNT_BIT_LENGTH.get(mode)[2];
	}
}

export { getBestMode, getCharacterCountBitLength };