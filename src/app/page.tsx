"use client";

import { useState, useRef } from 'react';
import { timelockDecrypt } from 'tlock-js';
import { HttpCachingChain, HttpChainClient } from 'drand-client';
import { defaultChainUrl } from 'tlock-js/drand/defaults';

interface CryopostMessage {
  encryptedKey: string;
  encryptedMessage: string;
  nextCheckIn: string; // This is the actual field name in exported files
  [key: string]: unknown;
}

// Create drand client (same as frontend)
const createDrandClient = () => {
  const clientOpts = {
    disableBeaconVerification: false,
    noCache: false,
    chainVerificationParams: {
      chainHash: "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971",
      publicKey: "83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a"
    }
  };
  
  return new HttpChainClient(
    new HttpCachingChain(defaultChainUrl, clientOpts),
    clientOpts
  );
};

export default function DecryptorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messageData, setMessageData] = useState<CryopostMessage | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setResult({ type: 'error', message: 'Please select a JSON file.' });
      return;
    }

    try {
      const content = await file.text();
      const data: CryopostMessage = JSON.parse(content);

      if (!data.encryptedKey || !data.encryptedMessage || !data.nextCheckIn) {
        setResult({ type: 'error', message: 'Invalid message format - missing required fields.' });
        return;
      }

      setSelectedFile(file);
      setMessageData(data);
      setResult(null);
      startCountdown(new Date(data.nextCheckIn));
    } catch (error) {
      setResult({ type: 'error', message: `Error reading file: ${(error as Error).message}` });
    }
  };

  const startCountdown = (unlockTime: Date) => {
    const updateCountdown = () => {
      const now = new Date();
      const timeRemaining = unlockTime.getTime() - now.getTime();
      
      if (timeRemaining <= 0) {
        setCountdown('Ready now!');
        return;
      }
      
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  };

  const handleDecrypt = async () => {
    if (!messageData) return;

    const unlockTime = new Date(messageData.nextCheckIn);
    const currentTime = new Date();
    
    if (currentTime < unlockTime) {
      const timeRemaining = Math.ceil((unlockTime.getTime() - currentTime.getTime()) / 1000);
      const hours = Math.floor(timeRemaining / 3600);
      const minutes = Math.floor((timeRemaining % 3600) / 60);
      const secs = timeRemaining % 60;
      const timeString = hours > 0 ? `${hours}h ${minutes}m ${secs}s` : minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
      
      setResult({
        type: 'info',
        message: `⏰ Message not ready yet!\n\nUnlock time: ${unlockTime.toLocaleString()}\nTime remaining: ${timeString}\n\nPlease wait until the unlock time has passed.`
      });
      return;
    }

    setIsDecrypting(true);
    
    try {
      const client = createDrandClient();
      
      // Step 1: Unwrap the onion-encrypted AES key (same as backend)
      let currentKey = messageData.encryptedKey; // hex string
      let isFirstAttempt = true;

      while (true) {
        try {
          const decryptedPayload = await timelockDecrypt(currentKey, client);
          isFirstAttempt = false;
          // It decrypted successfully. The result is the new candidate for the key.
          // The payload of one layer of encryption is the ciphertext of the next,
          // which is a UTF-8 encoded hex string.
          currentKey = decryptedPayload.toString('utf-8');
        } catch (error) {
          // Decryption failed. This means the `currentKey` we just tried to decrypt
          // was not a valid ciphertext.
          if (isFirstAttempt) {
            // If it failed on the very first try, the original key is invalid.
            console.error("Initial decryption failed.", error);
            throw new Error("Invalid encrypted key.");
          }
          // Otherwise, the `currentKey` (which is a hex string) must be the hex
          // representation of our final AES key.
          console.log('Finished unwrapping onion. Got final AES key.');
          break;
        }
      }

      // Step 2: Use the AES key to decrypt the actual message
      const aesKeyBuffer = Buffer.from(currentKey, 'hex');
      const encryptedMessageBuffer = Buffer.from(messageData.encryptedMessage, 'hex');
      
      // Decrypt using Web Crypto API (AES-GCM)
      const iv = encryptedMessageBuffer.slice(0, 12);
      const encryptedWithAuthTag = encryptedMessageBuffer.slice(12); // includes auth tag
      
      // Import the AES key for Web Crypto API
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        aesKeyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt the message
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        aesKey,
        encryptedWithAuthTag
      );
      
      const decryptedMessage = new TextDecoder().decode(decryptedBuffer);

      setResult({
        type: 'success',
        message: `✅ Message decrypted successfully!\n\nUnlocked at: ${unlockTime.toLocaleString()}\n\n${decryptedMessage}`
      });
    } catch (error) {
      console.error('Decryption error:', error);
      setResult({
        type: 'error',
        message: `❌ Decryption failed: ${(error as Error).message}\n\nThis could mean:\n• The unlock time hasn't been reached yet\n• The message file is corrupted\n• Network connectivity issues`
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleNetworkStatus = async () => {
    try {
      const client = createDrandClient();
      const latest = await client.latest();
      const info = await client.chain().info();
      
      setResult({
        type: 'info',
        message: `🌐 Network Status\n\nCurrent Round: ${latest.round}\nCurrent Time: ${new Date().toLocaleString()}\nNetwork Period: ${info.period} seconds\nChain Hash: ${info.hash}\nPublic Key: ${info.public_key.substring(0, 32)}...`
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: `❌ Failed to get network status: ${(error as Error).message}`
      });
    }
  };

  const isReady = messageData ? new Date() >= new Date(messageData.nextCheckIn) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            🔒 Cryopost Decryptor
          </h1>
          <p className="text-gray-200 text-lg">Decrypt your timelock messages when ready</p>
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <div
            className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-white/10 transition-all duration-300 hover:scale-105"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              if (files.length > 0) handleFileSelect(files[0]);
            }}
          >
            <div className="text-4xl mb-4">📁</div>
            <div>
              <p className="text-lg font-semibold mb-2 text-white">Drop your message file here</p>
              <p className="text-gray-300">or <span className="text-blue-400 underline">click to browse</span></p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
              <strong className="text-white">Selected:</strong> <span className="text-gray-200">{selectedFile.name}</span>
            </div>
          )}
        </div>

        {/* Message Preview */}
        {messageData && (
          <div className="mb-8 p-6 bg-white/10 rounded-2xl border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Message Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="font-semibold text-gray-200">Unlock Time:</span>
                <span className="text-blue-400">{new Date(messageData.nextCheckIn).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="font-semibold text-gray-200">Status:</span>
                <span className={isReady ? "text-green-400 font-bold" : "text-orange-400 font-bold"}>
                  {isReady ? "✅ Ready to decrypt" : "⏰ Waiting for unlock time"}
                </span>
              </div>
              {!isReady && (
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-gray-200">Time Remaining:</span>
                  <span className="text-purple-400 font-bold">{countdown}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleDecrypt}
            disabled={!messageData || isDecrypting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isDecrypting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Decrypting...
              </>
            ) : (
              <>Decrypt Message</>
            )}
          </button>
          <button
            onClick={handleNetworkStatus}
            className="bg-white/10 text-white font-semibold py-3 px-6 rounded-full hover:bg-white/20 transition-all duration-300 border border-white/30"
          >
            Check Network Status
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`p-6 rounded-2xl mb-4 border ${
            result.type === 'success' ? 'bg-green-900/20 border-green-400/30 text-green-200' :
            result.type === 'error' ? 'bg-red-900/20 border-red-400/30 text-red-200' :
            'bg-blue-900/20 border-blue-400/30 text-blue-200'
          }`}>
            <pre className="whitespace-pre-wrap font-mono text-sm">{result.message}</pre>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-300 text-sm">
          <p className="mb-2"><strong className="text-white">How it works:</strong> Upload your Cryopost message JSON file. If the unlock time has passed, the message will be decrypted using the drand timelock network.</p>
          <p className="mb-2">This tool runs entirely in your browser. No data is sent to any server.</p>
          <p>Built with ❄️ for the Cryopost community | <a href="https://github.com/drand/timevault" target="_blank" className="text-blue-400 hover:underline">Based on Timevault</a></p>
        </div>
      </div>
    </div>
  );
}
