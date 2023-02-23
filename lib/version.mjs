import { getTotalErrorCodeWords } from './error-correction.mjs';
import { getCharacterCountBitLength } from './mode.mjs';

const QRCODE_TOTAL_CODEWORDS = [
	0,
	26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 466, 532, 581, 655, 733, 
	815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 
	2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706
];

function checkVersionInRange(version) {
	if(version === undefined) throw new Error('version can\'t be empty');
	if(version < 1 || version > 40) throw new Error('version must be in range 1 - 40');
}

function getQRCodeSize(version) {
	checkVersionInRange(version);
	return version * 4 + 17;
}

function getQRCodeTotalCodeWords(version) {
	checkVersionInRange(version);
	return QRCODE_TOTAL_CODEWORDS[version]
}

function getTotalDataCodeWords(version, errorCorrectionLevel, mode) {
	checkVersionInRange(version);

	const totalCodeWords = getQRCodeTotalCodeWords(version);
	const ecTotalCodeWords = getTotalErrorCodeWords(version, errorCorrectionLevel);
	const totalDataCodeBits = (totalCodeWords - ecTotalCodeWords) * 8 - getCharacterCountBitLength(version, mode);

	switch(mode) {
		case 0b0010:
			return Math.floor((totalDataCodeBits / 11) * 2) - 1;
			break;
		case 0b0100:
			return Math.floor(totalDataCodeBits / 8) - 1;
			break;
		default:
			throw new Error('This mode is not supported');
	}
}

function getBestVersion(data, errorCorrectionLevel, mode) {
	let fitVersion = 1;
	for(; fitVersion <= 40; fitVersion++) {
		let currentVersionCapacity = getTotalDataCodeWords(fitVersion, errorCorrectionLevel, mode);
		if(data.length <= currentVersionCapacity) {
			break;
		}

		if(fitVersion === 40) {
			throw new Error('Data too long to fit in a qr code');
		}
	}

	return fitVersion;
}

export { getQRCodeSize, getQRCodeTotalCodeWords, checkVersionInRange, getTotalDataCodeWords, getBestVersion };