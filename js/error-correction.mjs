import { checkVersionInRange } from './version.mjs';

const TOTAL_EC_CODEWORDS = [
	// M, L, H, Q
	10, 7, 17, 13,
	16, 10, 28, 22,
	26, 15, 44, 36,
	36, 20, 64, 52,
	48, 26, 88, 72,
	64, 36, 112, 96,
	72, 40, 130, 108,
	88, 48, 156, 132,
	110, 60, 192, 160,
	130, 72, 224, 192,
	150, 80, 264, 224,
	176, 96, 308, 260,
	198, 104, 352, 104,
	216, 120, 384, 120,
	240, 132, 432, 360,
	280, 144, 480, 408,
	308, 168, 448, 532,
	338, 180, 588, 504,
	364, 196, 650, 546,
	416, 224, 700, 600,
	442, 224, 750, 664,
	476, 252, 816, 690,
	504, 270, 900, 750,
	560, 300, 960, 810,
	588, 312, 1050, 870,
	644, 336, 1110, 952,
	700, 360, 1200, 1020,
	728, 390, 1260, 1050,
	784, 420, 1350, 1140,
	812, 450, 1440, 1200,
	868, 480, 1530, 1290,
	924, 510, 1620, 1350,
	980, 540, 1710, 1440,
	1036, 570, 1890, 1590,
	1120, 600, 1980, 1680, 
	1204, 630, 2100, 1770,
	1260, 660, 2220, 1860,
	1316, 720, 2310, 1950,
	1372, 750, 2430, 2040,
];

const errorCorrectionLevel = {
	L: 0b01,
	M: 0b00,
	Q: 0b11,
	H: 0b10
};

function getTotalErrorCodeWords(version, ecLevel) {
	checkVersionInRange(version);
	if(ecLevel === undefined) throw new Error('ecLevel can\'t be empty');
	if(ecLevel !== 0b00 && ecLevel !== 0b01 && ecLevel !== 0b10 && ecLevel !== 0b11) throw new Error('ecLevel must be a binary number 00 || 01 || 10 || 11');

	return TOTAL_EC_CODEWORDS[(version - 1) * 4 + ecLevel];
}

export { errorCorrectionLevel, getTotalErrorCodeWords };