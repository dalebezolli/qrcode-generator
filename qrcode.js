// ONLY ACCOUNTING FOR ALNUMS CURRENTLY
function generateQRCode() {
	const [aToInteger, integerToA] = generateGaloisField();

    const messageInputBox = document.getElementById('message');
    const payloadInputBox = document.getElementById('payload');

	const data = messageInputBox.value;
	const version = 1;
	const mode = '0010';
	const errorCorrectionLevel = 'M';

    const message = encodeData(data, mode, version, errorCorrectionLevel).match(/.{8}/g).map(element => parseInt(element, 2));
    const payload = payloadInputBox.value.split(', ').map(element => parseInt(element));
	const errorCodeWords = generateErrorCodeWords(message, payload, [aToInteger, integerToA]);

	console.log("" + message.map(element => {
		string = element.toString(2);
		const leading0s = 8 - string.length;
		return "0".repeat(leading0s) + string;
	}));

	console.log("" + errorCodeWords.map(element => {
		string = element.toString(2);
		const leading0s = 8 - string.length;
		return "0".repeat(leading0s) + string;
	}));
}

function encodeData(data, mode, version, errorCorrectionLevel) {
	const batchedData = [];
	const characterCount = data.length;
	let characterBitsSize;
	let maxDataBytesLength = getVersionInformation(version)[0].capacity[errorCorrectionLevel];

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

function generateErrorCodeWords(message, payload, galoisFields) {	
    let messageData = [...message];
	const messageDataLength = message.length;
	let errorCorrectionCodewords;

	const [aToInteger, integerToA] = galoisFields;

	for(let currentIndex = 0; currentIndex < messageDataLength; currentIndex++) {
		console.log('ERROR CORRECTION CODEWORD GENERATION STEP ' + (currentIndex + 1));

		const currentMessageByteAlphaExponent = integerToA.get(messageData[currentIndex]);
		console.log("Convert current message byte to alpha exponent: ", {messageByte: messageData[currentIndex], messageAlphaByte: currentMessageByteAlphaExponent});

		const calculatedPayload = payload.map(currentExponent =>  {
			const addedExponents = currentExponent + currentMessageByteAlphaExponent;
			return aToInteger.get((addedExponents > 255 ? addedExponents % 255 : addedExponents));
		});
		console.log("Add payload's alpha exponents with current message exponent and convert back to integer notation", {calculatedPayload});

		for(let i = currentIndex, j = 0; j < calculatedPayload.length || i < messageDataLength; i++, j++) {
			messageData[i] = messageData[i] ^ calculatedPayload[j];
		}
		console.log("XOR Message polynomial with payload: ", {message});
	}

	errorCorrectionCodewords = messageData.filter(value => value != 0);
	console.log("Error correction codewords: ", {errorCorrectionCodewords});
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
		[1, [{mode: 'Alphanumeric', capacity: {'L': 19, 'M': 16, 'Q': 13, 'H': 9}}]],
		[2, [{mode: 'Alphanumeric', capacity: {'L': 34, 'M': 28, 'Q': 22, 'H': 16}}]],
		[3, [{mode: 'Alphanumeric', capacity: {'L': 55, 'M': 44, 'Q': 34, 'H': 26}}]],
		[4, [{mode: 'Alphanumeric', capacity: {'L': 80, 'M': 64, 'Q': 48, 'H': 36}}]]
	]);

	return versionInformation.get(version);
}

function toBinary(number, bits) {
	const binaryRepresentation = number.toString(2);
	return '0'.repeat(bits - binaryRepresentation.length) + binaryRepresentation;
}
