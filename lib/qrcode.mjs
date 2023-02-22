import { errorCorrectionLevel as ecLevel, getTotalErrorCodeWords } from './error-correction.mjs';
import { mask as maskData } from './mask.mjs';
import { DataBuffer } from './databuffer.mjs';
import { DataMatrix } from './datamatrix.mjs';
import { getQRCodeSize, getQRCodeTotalCodeWords } from './version.mjs';

function generate(data, options) {
	if(typeof data !== 'string' || data === '') {
		throw Error('Data input must be a string');
	}

	let version = 0;
	let mask;
	let errorCorrectionLevel;

	if(typeof options !== 'undefined') {
		if(!isNaN(options.version) && options.version >= 1 && options.version <= 40) {
			version = options.version;
		}

		if(!isNaN(options.mask) && options.mask >= -1 && options.mask <= 7) {
			if(options.mask === -1) mask = {mask: -1};
			else mask = maskData[options.mask];
		}

		if(typeof options.errorCorrectionLevel === 'string') {
			errorCorrectionLevel = ecLevel[options.errorCorrectionLevel];
		}
	}

	const qrMatrix = genereateQRCode(data, version, errorCorrectionLevel, mask);

	return qrMatrix;
}

function genereateQRCode(data, version, errorCorrectionLevel, mask) {
	const qrCodeSize = getQRCodeSize(version);

    const dataBuffer = encodeData(data, version, errorCorrectionLevel);
	const errorCorrectionBuffer = generateErrorCorrectionBuffer(dataBuffer.buffer, version, errorCorrectionLevel);
	const messageBuffer = new DataBuffer(dataBuffer.length / 8 + errorCorrectionBuffer.length / 8);
	const qrMatrix = new DataMatrix(qrCodeSize);

	for(let column = 0; column < qrMatrix.size; column++) {
		for(let row = 0; row < qrMatrix.size; row++) {
			qrMatrix.set(row, column, false, true);
		}
	}

	dataBuffer.buffer.forEach(byte => {
		messageBuffer.push(byte, 8);
	});
	errorCorrectionBuffer.buffer.forEach(byte => {
		messageBuffer.push(byte, 8);
	});

	generateFinderPatterns(qrMatrix);
	generateTimingPatterns(qrMatrix);
	generateDarkPattern(qrMatrix, version);
	generateAlginmentPatterns(qrMatrix, version);

	generateDataPattern(qrMatrix, messageBuffer);

	if(mask.mask === -1) {
		let currentMask = 0;
		const totalScores = new Array(8);
		while(currentMask < maskData.length) {
			const testMask = maskData[currentMask++];

			generateMaskPattern(qrMatrix, testMask);
			generateFormatPattern(qrMatrix, errorCorrectionLevel, testMask);
			
			totalScores[testMask.mask] = runFirstTest(qrMatrix);
			totalScores[testMask.mask] += runSecondTest(qrMatrix);
			totalScores[testMask.mask] += runThirdTest(qrMatrix);
			totalScores[testMask.mask] += runFourthTest(qrMatrix);

			generateMaskPattern(qrMatrix, testMask);
		}
		mask = maskData[totalScores.indexOf(Math.min(...totalScores))];
	}

	generateMaskPattern(qrMatrix, mask);

	generateFormatPattern(qrMatrix, errorCorrectionLevel, mask);

	return qrMatrix;
}

function generateFinderPatterns(matrix) {
	for(let i = 0; i < matrix.size; i++) {
		for(let j = 0; j < matrix.size; j++) {
			if(i < 7 && j < 7 || i > matrix.size - 8 && j < 7 || i < 7 && j > matrix.size - 8) {
				let finderStartX = (i < 7) ? 0 : matrix.size - 7;
				let finderStartY = (j < 7) ? 0 : matrix.size - 7;

				let data = false;
				if(i === finderStartX || i === finderStartX + 6 || j === finderStartY || j === finderStartY + 6) {
					data = true;
				}

				if(i > finderStartX + 1 && i < finderStartX + 5 && j > finderStartY + 1 && j < finderStartY + 5) {
					data = true;
				}

				matrix.set(i, j, data, false);
			} else if((j === 7 && (i < 8 || i > matrix.size - 9) || j === matrix.size - 8 && i < 8) || (i === 7 && (j < 8 || j > matrix.size - 9) || i === matrix.size - 8 && j < 8)) {
				matrix.set(i, j, false, false);
			}
		}
	}
}

function generateTimingPatterns(matrix) {
	for(let i = 0; i < matrix.size; i++) {
		for(let j = 0; j < matrix.size; j++) {
			if(j === 6 && (i > 7 && i < matrix.size - 8) || i === 6 && (j > 7 && j < matrix.size - 8)) {
				const location = (j > i) ? j : i;
				const data = (location % 2 === 0) ? true : false;
				matrix.set(i, j, data, false);
			}
		}
	}
}

function generateDarkPattern(matrix, version) {
	matrix.set((version * 4 + 9), 8, true, false);
}

const ALIGNMENT_PATTERN_POSITIONS = [
	6, 18,
	6, 22,
	6, 26,
	6, 30,
	6, 34,
	6, 22, 38,
	6, 24, 42,
	6, 26, 46,
	6, 28, 50,
	6, 30, 54,
	6, 32, 58,
	6, 34, 62,
	6, 26, 46, 66,
	6, 26, 48, 70,
	6, 26, 50, 74,
	6, 30, 54, 78,
	6, 30, 56, 82,
	6, 30, 58, 86,
	6, 34, 62, 90,
	6, 28, 50, 72, 94,
	6, 26, 50, 74, 98,
	6, 30, 54, 78, 102,
	6, 28, 54, 80, 106,
	6, 32, 58, 84, 110,
	6, 30, 58, 86, 114,
	6, 34, 62, 90, 118,
	6, 26, 50, 74, 98, 122,
	6, 30, 54, 78, 102, 126,
	6, 26, 52, 78, 104, 130,
	6, 30, 56, 82, 108, 134,
	6, 34, 60, 86, 112, 138,
	6, 30, 58, 86, 114, 142,
	6, 34, 62, 90, 118, 146,
	6, 30, 54, 78, 102, 126, 150,
	6, 24, 50, 76, 102, 126, 154,
	6, 27, 54, 80, 106, 132, 158,
	6, 32, 58, 84, 110, 136, 162,
	6, 26, 54, 82, 110, 138, 166,
	6, 30, 58, 86, 114, 142, 170,
];

function generateAlginmentPatterns(matrix, version) {
	if(version < 2) return;

	const alignmentCoordsCount = Math.floor(version / 7) + 2;

	let alginmentCoordsSkipped = 0;
	for(let i = 2; i < version; i++) {
		alginmentCoordsSkipped += Math.floor(i / 7) + 2;
	}

	const unmatchedCoords = new Array(alignmentCoordsCount);
	for(let i = 0; i < alignmentCoordsCount; i++) {
		unmatchedCoords[i] = ALIGNMENT_PATTERN_POSITIONS[alginmentCoordsSkipped + i];
	}

	const matchedCoords = [];

	for(let i = 0; i < alignmentCoordsCount; i++) {
		for(let j = 0; j < alignmentCoordsCount; j++) {
			if(
				(unmatchedCoords[i] < 8 && unmatchedCoords[j] < 8)
				|| (unmatchedCoords[i] < 8 && unmatchedCoords[j] > matrix.size - 8)
				|| (unmatchedCoords[i] > matrix.size - 8 && unmatchedCoords[j] < 8)
			) {
				continue
			}
			matchedCoords.push([unmatchedCoords[i], unmatchedCoords[j]]);
		}
	}

	for(let alignmentPattern = 0; alignmentPattern < matchedCoords.length; alignmentPattern++) {
		const column = matchedCoords[alignmentPattern][0];
		const row = matchedCoords[alignmentPattern][1];

		for(let i = 0; i < matrix.size; i++) {
			for(let j = 0; j < matrix.size; j++) {
				if( 
					(i === row && j === column)
					|| ((i === row - 2 || i === row + 2) && (j >= column - 2 && j <= column + 2))
					|| ((i > row - 2 && i < row + 2) && (j === column - 2 || j === column + 2))
				) {
					matrix.set(i, j, true, false);
				} else if(i > row - 2 && i < row + 2 && j > column - 2 && j < column + 2) {
					matrix.set(i, j, false, false);
				}
			}
		}
	}

}

function generateDataPattern(matrix, messageBuffer) {
	let column = matrix.size - 1;
	let row = matrix.size - 1;

	let direction = -1;
	let subColumn = 0;
	let bitPos = 0;

	while(bitPos < messageBuffer.length) {
		if(subColumn > 1) {
			row = row + direction;
			subColumn = 0;
		}

		if(
			(row < 9 && (column > matrix.size - 9 || column < 9)) 
			|| (row < 0 && (column > 8 && column < matrix.size - 8)) 
			|| (row > matrix.size - 1 && column > 8) 
			|| (row > matrix.size - 9 && column < 9)
		) {
			column -= 2;
			direction = direction*(-1);
			row += direction;
		}

		while(row > matrix.size - 9 && column < 9) {
			row += direction;
		}
		
		if(row === 6) {
			row += direction;
		}

		if(column === 6) {
			column -= 1;
		}

		if(matrix.isMaskable(row, column - subColumn) === true) {
			matrix.set(row, column - subColumn, messageBuffer.readBit(bitPos) === 1, true);
			bitPos++;
			subColumn++;
		} else {
			subColumn++;
			continue;
		}
	}
}

const formatPattern = [
	'101010000010010', // M
	'101000100100101', 
	'101111001111100',
	'101101101001011',
	'100010111111001',
	'100000011001110',
	'100111110010111',
	'100101010100000',
	'111011111000100', // L
	'111001011110011',
	'111110110101010',
	'111100010011101',
	'110011000101111',
	'110001100011000',
	'110110001000001',
	'110100101110110',
	'001011010001001', // H
	'001001110111110',
	'001110011100111',
	'001100111010000',
	'000011101100010',
	'000001001010101',
	'000110100001100',
	'000100000111011',
	'011010101011111', // Q
	'011000001101000',
	'011111100110001',
	'011101000000110',
	'010010010110100',
	'010000110000011',
	'010111011011010',
	'010101111101101',
];

function generateFormatPattern(matrix, errorCorrectionLevel, mask) {
	const formatInformation = errorCorrectionLevel << 3 | mask.mask;
	const formatString = formatPattern[formatInformation];

	let formatXIndex = 0, formatYIndex = formatString.length - 1;
	for(let i = 0; i < matrix.size; i++) {
		for(let j = 0; j < matrix.size; j++) {
			if(i === 8 && (j < 6 || (j > 6 && j < 8) || j > matrix.size - 9 )) {
				matrix.set(i, j, formatString.charAt(formatXIndex++) === '1', false);
			}

			if(j === 8 && (i < 6 || (i > 6 && i < 9) || i > matrix.size - 8)) {
				matrix.set(i, j, formatString.charAt(formatYIndex--) === '1', false);
			}
		}
	}
}

function generateMaskPattern(matrix, mask) {
	for(let row = 0; row < matrix.size; row++) {
		for(let col = 0; col < matrix.size; col++) {
			if(matrix.isMaskable(row, col) && mask.pattern(row, col) === 0) {
				matrix.set(row, col, !matrix.get(row, col), true);
			}
		}
	}
}

function runFirstTest(matrix) {
	const SCORE_MULTIPLIER = 3;
	const MIN_ELEMENTS_IN_SEQUENCE = 5;

	let score = 0;
	for(let row = 0; row < matrix.size; row++) {
		let counter = 1;
		let currentBit = matrix.get(row, 0);

		for(let column = 1; column < matrix.size; column++) {
			if(matrix.get(row, column) === currentBit) counter++;
			else {
				if(counter >= MIN_ELEMENTS_IN_SEQUENCE) {
					score += SCORE_MULTIPLIER + (counter - MIN_ELEMENTS_IN_SEQUENCE);
				}

				counter = 1;
				currentBit = !currentBit;
			}

			if(column === matrix.size - 1 && counter >= MIN_ELEMENTS_IN_SEQUENCE) {
				score += SCORE_MULTIPLIER + (counter - MIN_ELEMENTS_IN_SEQUENCE);
			}
		}
	}

	for(let column = 0; column < 1; column++) {
		let counter = 1;
		let currentBit = matrix.get(0, column);

		for(let row = 1; row < matrix.size; row++) {
			if(matrix.get(row, column) === currentBit) counter++;
			else {
				if(counter >= MIN_ELEMENTS_IN_SEQUENCE) {
					score += SCORE_MULTIPLIER + (counter - MIN_ELEMENTS_IN_SEQUENCE);
				}

				counter = 1;
				currentBit = !currentBit;
			}

			if(column === matrix.size - 1 && counter >= MIN_ELEMENTS_IN_SEQUENCE) {
				score += SCORE_MULTIPLIER + (counter - MIN_ELEMENTS_IN_SEQUENCE);
			}
		}
	}
	return score;
}

function runSecondTest(matrix) {
	const SCORE_MULTIPLIER = 3;
	let blocks = 0;

	for(let row = 0; row < matrix.size - 1; row++) {
		for(let column = 0; column < matrix.size - 1; column++) {
			const topLeft = matrix.get(row, column);
			const topRight = matrix.get(row, column + 1);
			const bottomLeft = matrix.get(row + 1, column);
			const bottomRight = matrix.get(row + 1, column + 1);

			if((topLeft === topRight) && (topLeft === bottomRight) && (topLeft === bottomLeft)) {
				blocks += 1;
			}
		}
	}

	return blocks * SCORE_MULTIPLIER;
}

function runThirdTest(matrix) {
	const SCORE_MULTIPLIER = 40;
	const PATTERN = [true, false, true, true, true, false, true];
	const MIN_EMPTY_SPACE = 4;

	let score = 0;
	for(let row = 0; row < matrix.size; row++) {
		let column = 0;
		let patternPos = 0;

		while(column < matrix.size) {
			if(matrix.get(row, column) === PATTERN[patternPos]) {
				patternPos++;
			} else {
				patternPos = 0;
			}

			if(patternPos === PATTERN.length) {
				let rightWhite = 1;
				while((rightWhite < MIN_EMPTY_SPACE || column + rightWhite < matrix.size) && matrix.get(row, column + rightWhite) === false) {
					rightWhite++;
				}

				let leftWhite = 1;
				while((leftWhite < MIN_EMPTY_SPACE || column - PATTERN.length - leftWhite > 0) && matrix.get(row, column - PATTERN.length + 1 - leftWhite) === false) {
					leftWhite++;
				}

				if(rightWhite > MIN_EMPTY_SPACE || leftWhite > MIN_EMPTY_SPACE) {
					score += SCORE_MULTIPLIER;
				}
			}

			column++;
		}
	}

	for(let column = 0; column < matrix.size; column++) {
		let row = 0;
		let patternPos = 0;

		while(row < matrix.size) {
			if(matrix.get(row, column) === PATTERN[patternPos]) {
				patternPos++;
			} else {
				patternPos = 0;
			}

			if(patternPos === PATTERN.length) {
				let rightWhite = 1;
				while((rightWhite < MIN_EMPTY_SPACE || row + rightWhite < matrix.size) && matrix.get(row + rightWhite, column) === false) {
					rightWhite++;
				}

				let leftWhite = 1;
				while((leftWhite < MIN_EMPTY_SPACE || row - PATTERN.length - leftWhite > 0) && matrix.get(row - PATTERN.length + 1 - leftWhite, column) === false) {
					leftWhite++;
				}

				if(rightWhite > MIN_EMPTY_SPACE || leftWhite > MIN_EMPTY_SPACE) {
					score += SCORE_MULTIPLIER;
				}
			}

			row++;
		}
	}

	return score;
}

function runFourthTest(matrix) {
	const SCORE_MULTIPLIER = 10;

	let score = 0;
	
	const totalCells = matrix.size * matrix.size;
	let totalDarkCells = 0;

	for(let row = 0; row < matrix.size; row++) {
		for(let column = 0; column < matrix.size; column++) {
			if(matrix.get(row, column) === true) {
				totalDarkCells++;
			}
		}
	}

	const percentageDarkCells = Math.round(totalDarkCells / totalCells * 100);
	let smallestIncrement = percentageDarkCells;
	let largestIncrement = percentageDarkCells;
	while(smallestIncrement % 5 !== 0) {
		smallestIncrement--;
	}
	while(largestIncrement % 5 !== 0) {
		largestIncrement++;
	}

	score = Math.min(Math.abs(smallestIncrement - 50) / 5, Math.abs(largestIncrement - 50) / 5) * SCORE_MULTIPLIER;
	return score;
}

const DATA_LENGTH_BYTES = new Map([
	[0b0010, [9, 11, 13]],
	[0b0100, [8, 16, 16]]
]);

function encodeData(data, version, errorCorrectionLevel) {
	const maxDataBytesLength = getQRCodeTotalCodeWords(version) - getTotalErrorCodeWords(version, errorCorrectionLevel);
	const maxDataBitsLength = maxDataBytesLength * 8;
	const dataBuffer = new DataBuffer(maxDataBytesLength);

	let mode;
	let dataLengthBytes;

	const alnumRegex = new RegExp('^[A-Z0-9 $%*+-.\/:]*$', 'g');
	if(alnumRegex.test(data)) {
		mode = 0b0010;
	} else {
		mode = 0b0100;
	}
	
	if(version < 10) {
		dataLengthBytes = DATA_LENGTH_BYTES.get(mode)[0];
	} else if(version < 27) {
		dataLengthBytes = DATA_LENGTH_BYTES.get(mode)[1];
	} else {
		dataLengthBytes = DATA_LENGTH_BYTES.get(mode)[2];
	}


	dataBuffer.push(mode, 4);
	dataBuffer.push(data.length, dataLengthBytes);

	switch(mode) {
		case 0b0010:
			encodeAlphanumericData(dataBuffer, data);
			break;
		case 0b0100:
			encodeByteData(dataBuffer, data);
			break;
	}

	dataBuffer.push(0, Math.min(4, (maxDataBitsLength - dataBuffer.length)));
	dataBuffer.push(0, (8 - dataBuffer.length % 8) % 8);

	for(let i = 0; dataBuffer.length < maxDataBitsLength; i++) {
		dataBuffer.push((i % 2 === 0 ? 0b11101100 : 0b00010001), 8);
	}

	return dataBuffer;
}

function encodeAlphanumericData(dataBuffer, data) {
	for(let i = 0; i + 2 <= data.length; i += 2) {
		let number = alphanumericMap.get(data[i].toUpperCase()) * 45;
		number += alphanumericMap.get(data[i + 1].toUpperCase());
		dataBuffer.push(number, 11);
	}

	if(data.length % 2) {
		dataBuffer.push(alphanumericMap.get(data[data.length - 1].toUpperCase()), 6);
	}
}

function encodeByteData(dataBuffer, data) {
	for(let i = 0; i < data.length; i++) {
		dataBuffer.push(data.charCodeAt(i), 8);
	}
}

function displayQRAsSVG(matrix, id) {
	const svg = document.getElementById(id);
	svg.setAttribute('viewBox', `0 0 ${matrix.size * 8} ${matrix.size * 8}`);

	let display = '<rect width="100%" height="100%" fill="#a0a0a0" shape-rendering="crispEdges"/>';

	for(let i = 0; i < matrix.size; i++) {
		for(let j = 0; j < matrix.size; j++) {
			let color = (matrix.get(j, i) === true ? '#000000' : '#ffffff');
			display += `<rect x="${i*8}" y="${j*8}" width="8" height="8" fill="${color}" shape-rendering="crispEdges"/>`;
		}
	}

	svg.innerHTML = display;
}

function generateErrorCorrectionBuffer(data, version, errorCorrectionLevel) {	
	const errorCorrectionBufferSize = getTotalErrorCodeWords(version, errorCorrectionLevel);
	const errorCorrectionBuffer = new DataBuffer(errorCorrectionBufferSize);
    let messageData = [...data];

	const [aToInteger, integerToA] = generateGaloisField();
	let generatorPolynomial = [0, 0];
	for(let n = 1; n < errorCorrectionBufferSize; n++) {
		const currentPolynomial = [];
		const currentNomial = [0, n];

		for(let i = 0; i < generatorPolynomial.length; i++) {
			for(let j = 0; j < currentNomial.length; j++) {
				const addedAlphaExponents = (generatorPolynomial[i] + currentNomial[j]) % 255;

				if(currentPolynomial[i + j] === undefined) {
					currentPolynomial[i + j] = addedAlphaExponents;
				} else {
					currentPolynomial[i + j] = integerToA.get(aToInteger.get(currentPolynomial[i + j]) ^ aToInteger.get(addedAlphaExponents));
				}
			}
		}

		generatorPolynomial = [...currentPolynomial];
	}

	for(let currentIndex = 0; currentIndex < data.length; currentIndex++) {
		const currentAlphaExponent = integerToA.get(messageData[currentIndex]);

		const integerPolynomial = generatorPolynomial.map(currentExponent =>  {
			const addedExponents = currentExponent + currentAlphaExponent;
			return aToInteger.get((addedExponents > 255 ? addedExponents % 255 : addedExponents));
		});

		for(let i = currentIndex, j = 0; j < integerPolynomial.length || i < data.length; i++, j++) {
			messageData[i] = messageData[i] ^ integerPolynomial[j];
		}
	}

	for(let i = 0, j = messageData.length - errorCorrectionBufferSize; i < errorCorrectionBuffer.buffer.length; i++, j++) {
		errorCorrectionBuffer.push(messageData[j], 8);
	}

	return errorCorrectionBuffer;
}

function generateGaloisField() {
	const gfMap = new Map();
	const inverseGfMap = new Map();

	for(let i = 0; i < 256; i++) {
		let gfi = gf(i);
		gfMap.set(i, gfi);
		if(inverseGfMap.has(gfi)) continue;
		inverseGfMap.set(gfi, i);
	}

	function gf(number) {
		if(number === 0) {
			return 1;
		}

		let prevGF;
		if(gfMap.has(number - 1)) {
			prevGF = gfMap.get(number - 1);
		} else {
			prevGF = gf(number - 1);
		}

		const num = prevGF * 2;

		return (num >= 256 ? num ^ 285 : num);
	}

	return [gfMap, inverseGfMap];
}

const alphanumericMap = new Map([
	['0', 0], ['1', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5], ['6', 6], ['7', 7], ['8', 8], ['9', 9],
	['A', 10], ['B', 11], ['C', 12], ['D', 13], ['E', 14], ['F', 15], ['G', 16], ['H', 17], ['I', 18], ['J', 19], ['K', 20], ['L', 21], ['M', 22],
	['N', 23], ['O', 24], ['P', 25], ['Q', 26], ['R', 27], ['S', 28], ['T', 29], ['U', 30], ['V', 31], ['W', 32], ['X', 33], ['Y', 34], ['Z', 35],
	[' ', 36], ['$', 37], ['%', 38], ['*', 39], ['+', 40], ['-', 41], ['.', 42], ['/', 43], [':', 44]
]);

function toBinary(number, bits) {
	const binaryRepresentation = number.toString(2);
	return (bits - binaryRepresentation.length >= 0 ) ? '0'.repeat(bits - binaryRepresentation.length) + binaryRepresentation : binaryRepresentation;
}

export { generate, displayQRAsSVG };