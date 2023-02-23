# QR Code Generator
A QR Code generator that allows the user to generate custom qr codes from the web interface as well as the api.

## Features

QR Code:
- Input Types: Automatic detection between alphanumeric and byte
- Automatic & manual mask selection
- Displays qrcode to svg

!!!! DOES NOT CREATE SEGMENTS & DOES NOT ENCODE VERSION INFORMATION YET

API:
- Automatic generation based on text
- Returns as svg

## Usage
### Live Deployment
Visit the [website](https://qrapi.vercel.app/) to use the interface or send a get request at ``https://qrapi.vercel.app/api/generate?text=<your text>`` and replace ``<your text>`` with your text.

### Personal Deployment
Run ``npm run build`` to bundle the code and run it with a live server or ``vercel dev`` to support api requests.