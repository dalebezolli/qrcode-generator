import {errorCorrectionLevel as ecLevel} from "./error-correction.mjs";
import {mask as maskData} from "./mask.mjs";
import { DataBuffer } from "./databuffer.mjs";
import { DataMatrix } from "./datamatrix.mjs";
import { getQRCodeSize } from "./version.mjs";

function generate(data, options, svgId) {
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

		if(!isNaN(options.mask) && options.mask >= 0 && options.mask <= 7) {
			mask = maskData[options.mask];
		}

		if(typeof options.errorCorrectionLevel === 'string') {
			errorCorrectionLevel = ecLevel[options.errorCorrectionLevel];
		}
	}

	const mode = '0010';
	const qrMatrix = genereateQRCode(data, version, mode, errorCorrectionLevel, mask);

	displayQRAsSVG(qrMatrix, 'svg');
}

function genereateQRCode(data, version, mode, errorCorrectionLevel, mask) {
	console.log(`GENERATE QR CODE v${version} level-${Object.keys(ecLevel).find(key => ecLevel[key] === errorCorrectionLevel)} mode-${mode}`);
	const qrCodeSize = getQRCodeSize(version);

    const dataBuffer = encodeData(data, mode, version, errorCorrectionLevel);
	const errorCorrectionBuffer = generateErrorCorrectionBuffer(dataBuffer.buffer, version, errorCorrectionLevel);
	const messageBuffer = new DataBuffer(dataBuffer.length / 8 + errorCorrectionBuffer.length / 8);
	const qrMatrix = new DataMatrix(qrCodeSize);

	dataBuffer.buffer.forEach(byte => {
		messageBuffer.push(byte, 8);
	});
	errorCorrectionBuffer.buffer.forEach(byte => {
		messageBuffer.push(byte, 8);
	});

	generateFinderPatterns(qrMatrix);
	generateTimingPatterns(qrMatrix);
	generateDarkPattern(qrMatrix, version);
	// generateFormatPattern(qrMatrix, errorCorrectionLevel, mask);

	// generateDataPattern(qrMatrix, messageBuffer);

	// generateMaskPattern(qrMatrix, mask);

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

function generateDataPattern(matrix, messageBuffer) {
	let messageBitPosX = matrix.size - 1;
	let messageBitPosY = matrix.size - 1;
	let direction = 1;

	for(let n = 0; n < messageBuffer.length; n++) {
		const currentCharacter = messageBuffer.readBit(n);
		const bit = currentCharacter === 1;

		// Add bit on location
		matrix.set(messageBitPosY, messageBitPosX, bit, true);
		console.log(`STEP ${n}: [${messageBitPosX}, ${messageBitPosY}] = ${matrix.get(messageBitPosY, messageBitPosX)}`);

		// Move correctly???
		if(n % 2 === 0) {
			messageBitPosX -= 1;
		} else {
			messageBitPosX += 1;
			messageBitPosY -= direction;
		}

		// If we reach horisontal timing pattern, chill
		if(messageBitPosY === 6) {
			messageBitPosY -= direction;
		}

		// If we reach vertical timing pattern, chill
		if(messageBitPosX === 6) {
			messageBitPosX--;
		}

		// If there already exists a bit or we're out of horisontal bounds
		if(matrix.get(messageBitPosY, messageBitPosX) !== undefined || messageBitPosY > matrix.size - 1 || messageBitPosY < 0) {
			messageBitPosX -= 2;
			direction = (direction === 1) ? -1 : 1;
			messageBitPosY -= direction;
		}
	
		// If we're on the last part of the message
		if(messageBitPosX < 9 && (messageBitPosY > matrix.size - 9 || messageBitPosY < 8)) {
			// Move up until there's nothing on top of us
			while(matrix.get(messageBitPosY, messageBitPosX) !== undefined) {
				messageBitPosY -= direction;
			}
		}
	}
}

function generateFormatPattern(matrix, errorCorrectionLevel, mask) {
	const formatString = errorCorrectionLevel.toString(2) + mask.mask;
	const normalizedFormatString = formatString.slice(formatString.indexOf('1'), formatString.length) + '0'.repeat(10);
	let payload = '10100110111';

	let errorCorrectionWords = normalizedFormatString;
	for(let i = 0; errorCorrectionWords.length >= payload.length; i++) {
		const paddedPayload = payload + (payload.length < errorCorrectionWords.length ? '0'.repeat(errorCorrectionWords.length - payload.length) : '');
		errorCorrectionWords = toBinary(parseInt(errorCorrectionWords, 2) ^ parseInt(paddedPayload, 2), 14);
		errorCorrectionWords = errorCorrectionWords.slice(errorCorrectionWords.indexOf(1), errorCorrectionWords.length);
	}

	const formatDataMaskPattern = '101010000010010';
	const formatStringWithErrorCorrection = formatString + errorCorrectionWords;
	const maskedFormatString = [];
	for(let i = 0; i < formatDataMaskPattern.length; i++) {
		const character = formatStringWithErrorCorrection[i] === '1';
		maskedFormatString[i] = ((formatDataMaskPattern[i] === '1') !== character) ? '1' : '0';
	}

	let formatYIndex = 0, formatXIndex = 0;
	for(let i = 0; i < matrix.size; i++) {
		for(let j = 0; j < matrix.size; j++) {
			if(i === 8 && (j < 6 || (j > 6 && j < 9) || j > 13)) {
				matrix.set(i, j, maskedFormatString[formatXIndex++] === '1', false);
			}

			if(j === 8 && (i < 6 || (i > 6 && i < 9) || i > 13)) {
				matrix.set(i, j, maskedFormatString[formatYIndex++] === '1', false);
			}
		}
	}
}

function generateMaskPattern(matrix, mask) {
	for(let i = 0; i < matrix.size; i++) {
		for(let j = 0; j < matrix.size; j++) {
			if(matrix.isMaskable(j, i) && mask.pattern(j, i) === 0) {
				matrix.set(j, i, !matrix.get(j, i), true);
			}
		}
	}
}

function encodeData(data, mode, version, errorCorrectionLevel) {
	const maxDataBytesLength = getVersionInformation(version)[0].capacity[errorCorrectionLevel].message;
	const dataBuffer = new DataBuffer(maxDataBytesLength);

	if(mode !== '0010') return;

	dataBuffer.push(2, 4);
	dataBuffer.push(data.length, 9);

	for(let i = 0; i + 2 < data.length; i += 2) {
		let number = alphanumericMap.get(data[i].toUpperCase()) * 45;
		number += alphanumericMap.get(data[i + 1].toUpperCase());
		dataBuffer.push(number, 11);
	}

	if(data.length % 2) {
		dataBuffer.push(alphanumericMap.get(data[data.length - 1].toUpperCase()), 6);
	}

	dataBuffer.push(0, 8 - dataBuffer.length % 8);

	const maxDataBitsLength = maxDataBytesLength * 8;
	for(let i = 0; dataBuffer.length < maxDataBitsLength; i++) {
		dataBuffer.push((i % 2 === 0 ? 0b11101100 : 0b00010001), 8);
	}

	return dataBuffer;
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
	const errorCorrectionBufferSize = getVersionInformation(version)[0].capacity[errorCorrectionLevel].error;
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

function getVersionInformation(version) {
	// TODO: Find a way to generate this information instead of creating a map for each version
	let versionInformation = new Map([
		[1, [{mode: 'Alphanumeric', capacity: {0b01: {message: 19, error: 7}, 0b00: {message: 16, error: 10}, 0b11: {message: 13, error: 13}, 0b10: {message: 9, error: 17}}}]],
		[2, [{mode: 'Alphanumeric', capacity: {0b01: {message: 34, error: 10}, 0b00: {message: 28, error: 16}, 0b11: {message: 22, error: 22}, 0b10: {message: 16, error: 28}}}]],
	]);

	return versionInformation.get(version);
}

function toBinary(number, bits) {
	const binaryRepresentation = number.toString(2);
	return (bits - binaryRepresentation.length >= 0 ) ? '0'.repeat(bits - binaryRepresentation.length) + binaryRepresentation : binaryRepresentation;
}

export {generate};