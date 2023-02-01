let integerToA;
let aToInteger;

function generateErrorCodeWords() {	
    const message = [];
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

	const startIndex = 0;
	const currentIndex = startIndex;

	console.log({integerToA, aToInteger})
	currentByteAlphaExponent = integerToA.get(message[currentIndex]);
	console.log("Convert current message byte to alpha exponent: " + message[currentIndex] + " " + currentByteAlphaExponent);
	payload.map(num =>  {
		return num + currentByteAlphaExponent;
	});
	

	console.log({payload});
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