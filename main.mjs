import {generate} from "./js/qrcode.mjs";

function generateQRCode() {
    const messageInputBox = document.getElementById('message');
    const versionInputBox = document.getElementById('version');
    const errorCorrectionLevelInputBox = document.getElementById('errorCorrectionLevel');
    const maskPatternInputBox = document.getElementById('maskPattern');

	const version = parseInt(versionInputBox.value) || 0;
	const errorCorrectionLevel = errorCorrectionLevelInputBox.value;
	// TODO: Remove mask pattern once best mask pattern detection is complete
	const maskPattern = parseInt(maskPatternInputBox.value) - 1;

	const userData = messageInputBox.value;
	const qrCodeSettings = {version, errorCorrectionLevel, maskPattern};

	generate(userData, qrCodeSettings, 'qrcode'); // TODO: Once qr code matrix generation is decoupled from qr code drawing delete the svgId
}

function drawQRToSVG(svgId) {
	const qrCodeSvg = document.getElementById(svgId);

}

document.querySelector('button').addEventListener('click', generateQRCode);