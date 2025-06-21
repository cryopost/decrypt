# 🔒 Cryopost Decryptor

A standalone web application for decrypting Cryopost timelock encrypted messages.

## Features

- **Drag & Drop Interface**: Simply drag your message JSON file onto the page
- **Live Countdown**: See exactly when your message will be ready to decrypt
- **Network Status**: Check the drand network status
- **Browser-Only**: No data leaves your browser - completely private
- **Beautiful UI**: Matches the Cryopost aesthetic

## How to Use

1. Open the decryptor in your browser
2. Drag and drop your Cryopost message JSON file
3. Wait for the unlock time (if not ready yet)
4. Click "Decrypt Message" when ready
5. Your decrypted message will appear!

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Deployment

This project can be easily deployed to GitHub Pages or any static hosting service:

```bash
npm run build
npm run export  # For static export
```

## Technical Details

- Built with Next.js 15 and TypeScript
- Uses the same `tlock-js` and `drand-client` libraries as the main Cryopost frontend
- Completely client-side - no server required
- Based on the proven Timevault approach

## Security

This tool runs entirely in your browser. No message data is ever sent to any server. The decryption happens locally using the drand timelock network.

---

Built with ❄️ for the Cryopost community
