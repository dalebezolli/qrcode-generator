import {errorCorrectionLevel as ecLevel} from "./error-correction.mjs";
import {mask as maskData} from "./mask.mjs";

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

	console.log({version, mask, errorCorrectionLevel}, options);

	const [aToInteger, integerToA] = generateGaloisField();

	const qrCodeSvg = document.getElementById(svgId);

	const mode = '0010';
	console.log(`GENERATE QR CODE v${version} level-${options.errorCorrectionLevel} mode-${mode}`);

    const message = encodeData(data, mode, version, errorCorrectionLevel).match(/.{8}/g).map(element => parseInt(element, 2));
	const errorCodeWords = generateErrorCodeWords(message, version, errorCorrectionLevel, [aToInteger, integerToA]);
	console.log(errorCodeWords);

	const messageWithErrorCodeWords = 
		message.map(element => {
			const string = element.toString(2);
			const leading0s = 8 - string.length;
			return "0".repeat(leading0s) + string;
		}).join('') +
		errorCodeWords.map(element => {
			const string = element.toString(2);
			const leading0s = 8 - string.length;
			return "0".repeat(leading0s) + string;
		}).join('');

	console.log(messageWithErrorCodeWords);

	const qrCodeSize = (version * 4) + 17;
	qrCodeSvg.setAttribute('viewBox', `0 0 ${qrCodeSize * 8} ${qrCodeSize * 8}`);

	let display = '<rect width="100%" height="100%" fill="#a0a0a0" shape-rendering="crispEdges"/>';
	for(let i = 0; i < qrCodeSize; i++) {
		for(let j = 0; j < qrCodeSize; j++) {
			if(i < 7 && j < 7 || i > qrCodeSize - 8 && j < 7 || i < 7 && j > qrCodeSize - 8) {
				let finderStartX = (i < 7) ? 0 : qrCodeSize - 7;
				let finderStartY = (j < 7) ? 0 : qrCodeSize - 7;

				let currentColor = '#ffffff';
				if(i === finderStartX || i === finderStartX + 6 || j === finderStartY || j === finderStartY + 6) {
					currentColor = '#000000';
				}

				if(i > finderStartX + 1 && i < finderStartX + 5 && j > finderStartY + 1 && j < finderStartY + 5) {
					currentColor = '#000000';
				}

				display += `<rect x="${i*8}" y="${j*8}" width="8" height="8" fill="${currentColor}" shape-rendering="crispEdges"/>`;
			} else if((j === 7 && (i < 8 || i > qrCodeSize - 9) || j === qrCodeSize - 8 && i < 8) || (i === 7 && (j < 8 || j > qrCodeSize - 9) || i === qrCodeSize - 8 && j < 8)) {
				display += `<rect x="${i*8}" y="${j*8}" width="8" height="8" fill="#ffffff" shape-rendering="crispEdges"/>`;
			} else if(j === 6 && (i > 7 && i < qrCodeSize - 8) || i === 6 && (j > 7 && j < qrCodeSize - 8)) {
				const location = (j > i) ? j : i;
				const color = (location % 2 === 0) ? '#000000' : '#ffffff';
				display += `<rect x="${i*8}" y="${j*8}" width="8" height="8" fill="${color}"/>`;
			} else if(i === 8 && j === version*4 + 9) {
				display += `<rect x="${i*8}" y="${j*8}" width="8" height="8" fill="#000000"/>`;
			} else if(j === 8 && (i < 8 && i != 6 || i > qrCodeSize - 9)) {
				display += `<rect class="formatModule" x="${i*8}" y="${j*8}" width="8" height="8" fill="#0000ff"/>`;
			} else if(i === 8 && (j < 9 && j !== 6 || j > qrCodeSize - 8)) {
				display += `<rect class="formatModule" x="${i*8}" y="${j*8}" width="8" height="8" fill="#0000ff"/>`;
			}		
		}
	}
	qrCodeSvg.innerHTML = display;

	let messageBitPosX = qrCodeSize - 1;
	let messageBitPosY = qrCodeSize - 1;
	let direction = 1;
	for(let n = 0; n < messageWithErrorCodeWords.length; n++) {
		const currentCharacter = messageWithErrorCodeWords.charAt(n);
		const color = (currentCharacter === '1') ? '#000000' : '#ffffff';

		display += `<rect class="dataModule" x="${messageBitPosX*8}" y="${messageBitPosY*8}" width="8" height="8" fill="${color}"/>`;

		if(n % 2 === 0) {
			messageBitPosX -= 1;
		} else {
			messageBitPosX += 1;
			messageBitPosY -= direction;
		}

		if(messageBitPosY === 6) {
			messageBitPosY -= direction;
		}

		if(document.querySelector(`rect[x='${messageBitPosX*8}'][y='${messageBitPosY*8}']`) || messageBitPosY > qrCodeSize - 1 || messageBitPosY < 0) {
			messageBitPosX -= 2;
			direction = (direction === 1) ? -1 : 1;
			messageBitPosY -= direction;
		}

		if(messageBitPosX === 6) {
			messageBitPosX--;
		}
	
		if(messageBitPosX < 9 && (messageBitPosY > qrCodeSize - 9 || messageBitPosY < 8)) {
			while(document.querySelector(`rect[x='${messageBitPosX*8}'][y='${messageBitPosY*8}']`)) {
				messageBitPosY -= direction;
			}
		}
	}

	qrCodeSvg.innerHTML = display;

	const formatString = errorCorrectionLevel.toString(2) + mask.mask;
	const normalizedFormatString = formatString.slice(formatString.indexOf('1'), formatString.length) + '0'.repeat(10);
	let payload = '10100110111';

	let errorCorrectionWords = normalizedFormatString;
	for(let i = 0; errorCorrectionWords.length >= payload.length; i++) {
		const temp = errorCorrectionWords;
		const paddedPayload = payload + (payload.length < errorCorrectionWords.length ? '0'.repeat(errorCorrectionWords.length - payload.length) : '');
		errorCorrectionWords = toBinary(parseInt(errorCorrectionWords, 2) ^ parseInt(paddedPayload, 2), 14);
		errorCorrectionWords = errorCorrectionWords.slice(errorCorrectionWords.indexOf(1), errorCorrectionWords.length);
		console.log(`# STEP ${i + 1}: \n\t${temp} ^ \n\t${paddedPayload} = \n\t${errorCorrectionWords}`);
	}

	const formatDataMaskPattern = '101010000010010';
	const formatStringWithErrorCorrection = formatString + errorCorrectionWords;
	const maskedFormatString = [];
	for(let i = 0; i < formatDataMaskPattern.length; i++) {
		const character = formatStringWithErrorCorrection[i] === '1';
		maskedFormatString[i] = ((formatDataMaskPattern[i] === '1') !== character) ? '1' : '0';
	}

	console.log(maskedFormatString.join(''));

	let formatYIndex = 0, formatXIndex = 0;
	for(let i = 0; i < qrCodeSize; i++) {
		for(let j = 0; j < qrCodeSize; j++) {
			const dataModule = qrCodeSvg.querySelector(`.dataModule[x="${i*8}"][y="${j*8}"]`);
			const formatModule = qrCodeSvg.querySelector(`.formatModule[x="${i*8}"][y="${j*8}"][fill="#0000ff"]`);

			if(dataModule && mask.pattern(i, j) === 0) {
				dataModule.setAttribute('fill', (dataModule.getAttribute('fill') === '#ffffff' ? '#000000' : '#ffffff'));
			}

			if(formatModule && i === 8) {
				formatModule.setAttribute('fill', (maskedFormatString[formatYIndex++] === '0' ? '#ffffff' : '#000000'));
				continue;
			}

			if(formatModule && j === 8) {
				formatModule.setAttribute('fill', (maskedFormatString[formatXIndex++] === '0' ? '#ffffff' : '#000000'));
			}
		}
	}
}

function encodeData(data, mode, version, errorCorrectionLevel) {
	const batchedData = [];
	const characterCount = data.length;
	let characterBitsSize;
	let maxDataBytesLength = getVersionInformation(version)[0].capacity[errorCorrectionLevel].message;

	if(version < 10) {
		characterBitsSize = 9;
	} else if(version < 27) {
		characterBitsSize = 11;
	} else {
		characterBitsSize = 13;
	}

	if(mode !== '0010') return;

	for(let i = 0; i < data.length; i++) {
		const character = alphanumericMap.get(data[i].toUpperCase());
		if(i % 2 === 0 && i !== data.length - 1) {
			batchedData[Math.floor(i / 2)] = character * 45;
		} else {
			const prevNum = batchedData[Math.floor(i / 2)] || 0;
			batchedData[Math.floor(i / 2)] = prevNum + character;
		}
	}

	const encodedDataBits = batchedData.map((characterBatch, index) => {
		const isLastAndOdd = index === batchedData.length - 1 && index % 2 === 1;
		return isLastAndOdd ? toBinary(characterBatch, 6) : toBinary(characterBatch, 11);
	}
	);

	const encodedMessage = mode + toBinary(characterCount, characterBitsSize) + encodedDataBits.join('');
	const trailingBits = encodedMessage.length % 8;

	let encodedPaddedMessage = encodedMessage + "0".repeat(8 - trailingBits);
	const padBytes = '1110110000010001';
	while(encodedPaddedMessage.length < maxDataBytesLength * 8) {
		encodedPaddedMessage += padBytes.slice(0, maxDataBytesLength * 8 - encodedPaddedMessage.length);
	}

	return encodedPaddedMessage;
}

function generateErrorCodeWords(message, version, errorCorrectionLevel, galoisFields) {	
	let errorCorrectionCodewords;
	const errorCorrectionCodewordsLength = getVersionInformation(version)[0].capacity[errorCorrectionLevel].error;

    let messageData = [...message];
	const messageDataLength = message.length;
	const [aToInteger, integerToA] = galoisFields;

	let payload = [0, 0];
	for(let n = 1; n < errorCorrectionCodewordsLength; n++) {
		const currentPolynomial = [];
		const currentNomial = [0, n];

		for(let i = 0; i < payload.length; i++) {
			for(let j = 0; j < currentNomial.length; j++) {
				const addedAlphaExponents = (payload[i] + currentNomial[j]) % 255;

				if(currentPolynomial[i + j] === undefined) {
					currentPolynomial[i + j] = addedAlphaExponents;
				} else {
					currentPolynomial[i + j] = integerToA.get(aToInteger.get(currentPolynomial[i + j]) ^ aToInteger.get(addedAlphaExponents));
				}
			}
		}

		payload = [...currentPolynomial];
	}


	for(let currentIndex = 0; currentIndex < messageDataLength; currentIndex++) {
		const currentMessageByteAlphaExponent = integerToA.get(messageData[currentIndex]);

		const calculatedPayload = payload.map(currentExponent =>  {
			const addedExponents = currentExponent + currentMessageByteAlphaExponent;
			return aToInteger.get((addedExponents > 255 ? addedExponents % 255 : addedExponents));
		});

		for(let i = currentIndex, j = 0; j < calculatedPayload.length || i < messageDataLength; i++, j++) {
			messageData[i] = messageData[i] ^ calculatedPayload[j];
		}
	}

	errorCorrectionCodewords = messageData.slice(messageData.length - errorCorrectionCodewordsLength, messageData.length);
	return errorCorrectionCodewords;
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
	['0', 0],
	['1', 1],
	['2', 2],
	['3', 3],
	['4', 4],
	['5', 5],
	['6', 6],
	['7', 7],
	['8', 8],
	['9', 9],
	['A', 10],
	['B', 11],
	['C', 12],
	['D', 13],
	['E', 14],
	['F', 15],
	['G', 16],
	['H', 17],
	['I', 18],
	['J', 19],
	['K', 20],
	['L', 21],
	['M', 22],
	['N', 23],
	['O', 24],
	['P', 25],
	['Q', 26],
	['R', 27],
	['S', 28],
	['T', 29],
	['U', 30],
	['V', 31],
	['W', 32],
	['X', 33],
	['Y', 34],
	['Z', 35],
	[' ', 36],
	['$', 37],
	['%', 38],
	['*', 39],
	['+', 40],
	['-', 41],
	['.', 42],
	['/', 43],
	[':', 44]
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