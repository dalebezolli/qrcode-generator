import { generate, drawSVG } from './lib/qrcode.mjs';

function generateQRCode() {
    const messageInputBox = document.getElementById('message');
    const versionInputBox = document.getElementById('version');
    const errorCorrectionLevelInputBox = document.getElementById('errorCorrectionLevel');
    const maskPatternInputBox = document.getElementById('maskPattern');
	const svgDiv = document.getElementById('svg');

	const version = parseInt(versionInputBox.value) || 0;
	const errorCorrectionLevel = errorCorrectionLevelInputBox.value;
	// TODO: Remove mask pattern once best mask pattern detection is complete
	const maskPattern = parseInt(maskPatternInputBox.value);

	const userData = messageInputBox.value;
	const qrCodeSettings = {version, errorCorrectionLevel, mask: maskPattern};

	const qrCodeData = generate(userData, qrCodeSettings);
	svgDiv.innerHTML = drawSVG(qrCodeData.matrix);
}

document.querySelector('button').addEventListener('click', generateQRCode);