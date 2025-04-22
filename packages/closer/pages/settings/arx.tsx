import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';
import Button from '../../components/ui/Button';
import Heading from '../../components/ui/Heading';
import PageNotFound from '../not-found';

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

const menuItems: MenuItem[] = [
  { id: 'kombucha', name: 'Kombucha', price: 2.5 },
  { id: 'cappuccino', name: 'Cappuccino', price: 2.5 },
  { id: 'flatwhite', name: 'Flat White', price: 3.0 },
  { id: 'latte', name: 'Latte', price: 3.5 },
  { id: 'espresso', name: 'Espresso', price: 1.5 },
  { id: 'doubleespresso', name: 'Double Espresso', price: 2.0 },
];

const SalesTerminal: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Redirect or show not found if not authenticated
  if (!isAuthenticated || !user) {
    return <PageNotFound back="/login" error="Please log in to access the sales terminal." />;
  }

  // …rest of your component logic…

  // Reset state
  const reset = () => {
    setSelected(null);
    setChallenge(null);
    setTxId(null);
  };

  // Close modal on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) reset();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selected]);

  // When an item is selected, detect chip and prepare payment
  useEffect(() => {
    if (!selected) return;

    const prepare = async (chipId: string) => {
      setStatus('Preparing payment...');
      try {
        if (!navigator.onLine) {
          setStatus('Cannot prepare payment: offline');
          return reset();
        }
        const { results } = await api.post('/arx/prepare-payment', { chipId, amount: selected.price });
        setTxId(results.txId);
        setChallenge(results.challenge);
        setStatus(`Tap & pay ${selected.price.toFixed(2)} credits for ${selected.name}`);
      } catch (e: any) {
        setStatus(`Error: ${e.response?.data?.error || e.message}`);
        console.error('prepare error:', e);
        reset();
      } finally {
        setBusy(false);
      }
    };

    // Immediately-invoked detection flow
    (async () => {
      setBusy(true);
      setStatus('Waiting for badge tap...');
      try {
        if (typeof NDEFReader === 'undefined') {
          throw new Error('NFC not supported on this device. Please use a device with NFC capabilities.');
        }
        const randomMessage = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0')).join('');
        const res = await execHaloCmdWeb({ name: 'sign', keyNo: 1, message: randomMessage });
        const chipId = res.tagUid || res.uid;
        if (!chipId || !/^[A-Fa-f0-9]+$/.test(chipId)) {
          throw new Error('Invalid badge UID format');
        }
        await prepare(chipId);
      } catch (e: any) {
        // Provide more helpful error messages for common scenarios
        let errorMessage = e.message || 'Unknown error';
        if (errorMessage.includes('NFC not supported')) {
          errorMessage = 'This device does not support NFC. Please try a different device.';
        } else if (errorMessage.includes('user canceled')) {
          errorMessage = 'NFC scanning was canceled. Please try again.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'NFC scan timed out. Please ensure your badge is properly placed on the device.';
        }
        setStatus(`Error: ${errorMessage}`);
        console.error('chip detect error:', e);
        reset();
        setBusy(false);
      }
    })();
  }, [selected]);

  // Handle tapping/challenge signing and finalizing payment
  const handleSignAndPay = async () => {
    if (!challenge || !txId) return;
    setBusy(true);
    setStatus('Signing challenge...');
    try {
      const { signature } = await execHaloCmdWeb({ name: 'sign', keyNo: 1, message: challenge });
      setStatus('Completing payment...');
      if (!navigator.onLine) {
        setStatus('Cannot complete payment: offline');
        return reset();
      }
      const { results } = await api.post('/arx/confirm-payment', { txId, signature });
      setStatus(results.success ? `Success! New balance: ${results.newBalance}` : `Payment failed: ${results.details}`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
      console.error('confirm error:', e);
    } finally {
      setBusy(false);
      setTimeout(() => reset(), 2000);
    }
  };

  return (
    <>
      <Head><title>Café Sales Terminal</title></Head>
      <div className="p-6 max-w-4xl mx-auto">
        <Heading>Café Menu</Heading>
        {status && <p className="mt-4 text-lg">{status}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {menuItems.map(item => (
            <button key={item.id}
              disabled={!!selected || busy}
              onClick={() => setSelected(item)}
              className="bg-white rounded-lg p-4 shadow hover:shadow-md transition disabled:opacity-50"
            >
              <div className="text-xl font-semibold">{item.name}</div>
              <div className="mt-2 text-lg">{item.price.toFixed(2)} credits</div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
               role="dialog" aria-modal="true" aria-labelledby="payment-modal-title" onClick={reset}>
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
              <h2 id="payment-modal-title" className="text-xl font-bold mb-4">
                {challenge ? `Tap & Pay ${selected.price.toFixed(2)} for ${selected.name}` : 'Initializing...'}
              </h2>
              <Button onClick={handleSignAndPay} disabled={!challenge || busy} className="w-full">
                {challenge ? 'Tap & Pay' : 'Loading...'}
              </Button>
              <Button onClick={reset} variant="secondary" className="w-full mt-3">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SalesTerminal;