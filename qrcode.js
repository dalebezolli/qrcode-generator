let integerToA;
let aToInteger;

function generateErrorCodeWords() {	
    let message = [];
    const payload = [];

    const messageInputBox = document.getElementById('message');
    const payloadInputBox = document.getElementById('payload');

    const messageData = messageInputBox.value.split(', ');
    const payloadData = payloadInputBox.value.split(', ');

	messageData.forEach(element => {
		message.push(parseInt(element));
	})

    payloadData.forEach(element => {
        payload.push(parseInt(element));
    })

	const dataLength = message.length;
	console.log(dataLength);
	for(let currentIndex = 0; currentIndex < dataLength; currentIndex++) {
		console.log('STEP ' + (currentIndex + 1));

		currentMessageByteAlphaExponent = integerToA.get(message[currentIndex]);
		console.log("Convert current message byte to alpha exponent: ", {messageByte: message[currentIndex], messageAlphaByte: currentMessageByteAlphaExponent});

		const calculatedPayload = payload.map(currentExponent =>  {
			const addedExponents = currentExponent + currentMessageByteAlphaExponent;
			return aToInteger.get((addedExponents > 255 ? addedExponents % 255 : addedExponents));
		});
		console.log("Add payload's alpha exponents with current message exponent and convert back to integer notation", {calculatedPayload});

		for(let i = currentIndex, j = 0; j < calculatedPayload.length || i < dataLength; i++, j++) {
			message[i] = message[i] ^ calculatedPayload[j];
		}
		console.log("XOR Message polynomial with payload: ", {message});
	}

	const errorCorrectionCodewords = message.filter(value => value != 0);
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