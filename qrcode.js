let integerToA;
let aToInteger;

function generateQRCode() {
    const messageInputBox = document.getElementById('message');
    const payloadInputBox = document.getElementById('payload');

    const message = messageInputBox.value.split(', ').map(element => parseInt(element));
    const payload = payloadInputBox.value.split(', ').map(element => parseInt(element));

	generateErrorCodeWords(message, payload);
}

function generateErrorCodeWords(message, payload) {	
    let messageData = [...message];
	const messageDataLength = message.length;
	let errorCorrectionCodewords;

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

[aToInteger, integerToA] = generateGaloisField();