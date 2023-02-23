import { generate, drawSVG } from '../lib/qrcode.mjs';

export default function helper(req, res) {
    if(!Object.keys(req.query).includes('text')) {
        return res.status(400).json({
            'status': 'not ok',
            'message': 'Unspecified \'text\' query'
        })
    }

    const data = req.query.text;

    const qrData = generate(data, { version: 0, errorCorrectionLevel: 'L', mask: -1 });
    const svg = drawSVG(qrData.matrix);

    return res.json({
        'status': 'ok',
        'svg': svg
    });
}