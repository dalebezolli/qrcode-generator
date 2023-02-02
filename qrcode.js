// ONLY ACCOUNTING FOR ALNUMS CURRENTLY
function generateQRCode() {
	const [aToInteger, integerToA] = generateGaloisField();

    const messageInputBox = document.getElementById('message');
    const versionInputBox = document.getElementById('version');
    const errorCorrectionLevelInputBox = document.getElementById('errorCorrectionLevel');

	const data = messageInputBox.value;
	const version = parseInt(versionInputBox.value);
	const errorCorrectionLevel = errorCorrectionLevelInputBox.value;
	const mode = '0010';
	console.log(`GENERATE QR CODE v${version} level-${errorCorrectionLevel} mode-${mode}`);

    const message = encodeData(data, mode, version, errorCorrectionLevel).match(/.{8}/g).map(element => parseInt(element, 2));
	const errorCodeWords = generateErrorCodeWords(message, version, errorCorrectionLevel, [aToInteger, integerToA]);

	const messageWithErrorCodeWords = 
		message.map(element => {
			string = element.toString(2);
			const leading0s = 8 - string.length;
			return "0".repeat(leading0s) + string;
		}).join('') +
		errorCodeWords.map(element => {
			string = element.toString(2);
			const leading0s = 8 - string.length;
			return "0".repeat(leading0s) + string;
		}).join('');

	console.log(messageWithErrorCodeWords);
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
		if(i % 2 === 0 && i !== data.length - 1) {
			batchedData[Math.floor(i / 2)] = alphanumericMap.get(data[i]) * 45;
		} else {
			const prevNum = batchedData[Math.floor(i / 2)] || 0;
			batchedData[Math.floor(i / 2)] = prevNum + alphanumericMap.get(data[i]);
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

	errorCorrectionCodewords = messageData.filter(value => value != 0);
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
	let versionInformation = new Map([
		[1, [{mode: 'Alphanumeric', capacity: {'L': {message: 19, error: 7}, 'M': {message: 16, error: 10}, 'Q': {message: 13, error: 13}, 'H': {message: 9, error: 17}}}]],
		[2, [{mode: 'Alphanumeric', capacity: {'L': {message: 34, error: 10}, 'M': {message: 28, error: 16}, 'Q': {message: 22, error: 22}, 'H': {message: 16, error: 28}}}]],
	]);

	return versionInformation.get(version);
}

function toBinary(number, bits) {
	const binaryRepresentation = number.toString(2);
	return '0'.repeat(bits - binaryRepresentation.length) + binaryRepresentation;
}
