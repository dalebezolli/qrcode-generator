const CHARACTER_COUNT_BIT_LENGTH = new Map([
	[0b0010, [9, 11, 13]],
	[0b0100, [8, 16, 16]]
]);

function getCharacterCountBitLength(version, mode) {
	if(version < 10) {
		return CHARACTER_COUNT_BIT_LENGTH.get(mode)[0];
	} else if(version < 27) {
		return CHARACTER_COUNT_BIT_LENGTH.get(mode)[1];
	} else {
		return CHARACTER_COUNT_BIT_LENGTH.get(mode)[2];
	}
}

export { getCharacterCountBitLength };