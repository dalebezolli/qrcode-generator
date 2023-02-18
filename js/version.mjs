function getQRCodeSize(version) {
	if(version === undefined) throw new Error('version is null');
	if(version < 1 || version > 40) throw new Error('version must be in range 1 - 40');

	return version * 4 + 17;
}

export { getQRCodeSize };