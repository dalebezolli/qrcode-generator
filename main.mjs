import { generate, displayQRAsSVG } from './js/qrcode.mjs';

function generateQRCode() {
    const messageInputBox = document.getElementById('message');
    const versionInputBox = document.getElementById('version');
    const errorCorrectionLevelInputBox = document.getElementById('errorCorrectionLevel');
    const maskPatternInputBox = document.getElementById('maskPattern');

	const version = parseInt(versionInputBox.value) || 0;
	const errorCorrectionLevel = errorCorrectionLevelInputBox.value;
	// TODO: Remove mask pattern once best mask pattern detection is complete
	const maskPattern = parseInt(maskPatternInputBox.value);

	const userData = messageInputBox.value;
	const qrCodeSettings = {version, errorCorrectionLevel, mask: maskPattern};

	const qrCodeMatrix = generate(userData, qrCodeSettings);
	displayQRAsSVG(qrCodeMatrix, 'svg');
}

document.querySelector('button').addEventListener('click', generateQRCode);