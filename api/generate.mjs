import { generate } from '../lib/qrcode.mjs';
import { createCanvas } from '@napi-rs/canvas';

export default function helper(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')

    if(!Object.keys(req.query).includes('text')) {
        return res.status(400).json({
            'status': 'not ok',
            'message': 'Unspecified \'text\' query'
        })
    }

    const data = req.query.text;

    const qrData = generate(data, { version: 0, errorCorrectionLevel: 'L', mask: -1 });

	const EMPTY_SPACE = 4;
	const PIXELS_PER_MODULE = 6;
	const displaySize = qrData.matrix.size + (EMPTY_SPACE * 2);

    const canvas = createCanvas(displaySize * PIXELS_PER_MODULE, displaySize * PIXELS_PER_MODULE);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for(let i = 0; i < qrData.matrix.size; i++) {
		for(let j = 0; j < qrData.matrix.size; j++) {
			let color = (qrData.matrix.get(j, i) === true ? '#000000' : '#ffffff');
			ctx.fillStyle = color;
			ctx.fillRect((i + EMPTY_SPACE) * PIXELS_PER_MODULE, (j + EMPTY_SPACE) * PIXELS_PER_MODULE, PIXELS_PER_MODULE, PIXELS_PER_MODULE);
		}
	}

    return res.json({
        'status': 'ok',
        'code': canvas.toDataURL()
    });
}