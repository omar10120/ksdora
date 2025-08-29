'use client';

import { useState } from 'react';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from '@/lib/firebase'; // your firebase init file

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}


export default function PhoneLogin() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [step, setStep] = useState<'enter-phone' | 'enter-code'>('enter-phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log("Recaptcha verified");
        }
      });
    }
  };

  const handleSendCode = async () => {
    setError('');
    if (!phone || !phone.startsWith('+')) {
      setError('Please enter a valid phone number including country code (e.g., +123456789)');
      return;
    }

    try {
      setLoading(true);
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;

      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('enter-code');
    } catch (err: any) {
      console.error("SMS not sent", err);
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };0

  const handleVerifyCode = async () => {
    setError('');
    if (!confirmationResult) {
      setError("No OTP confirmation found.");
      return;
    }

    try {
      setLoading(true);
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      alert("Phone number verified!");
      console.log("User:", user);
    } catch (err: any) {
      console.error("Invalid OTP", err);
      setError("Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="text-black max-w-sm mx-auto p-4 bg-white shadow-md rounded-md">
      <h2 className="text-lg font-bold mb-4">Phone Sign-In</h2>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {step === 'enter-phone' && (
        <>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleSendCode}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </>
      )}

      {step === 'enter-code' && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleVerifyCode}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" />
    </div>
  );
}
