import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from 'closer';
// Import execHaloCmdWeb to interact with ARX chip via NFC
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';

interface MenuItem {
    id: string;
    name: string;
    price: number; // in credits
}

const menuItems: MenuItem[] = [
    { id: 'kombucha', name: 'Kombucha', price: 2.5 },
    { id: 'cappuccino', name: 'Cappuccino', price: 2.5 },
    { id: 'flatwhite', name: 'Flat White', price: 3.0 },
    { id: 'latte', name: 'Latte', price: 3.5 },
    { id: 'espresso', name: 'Espresso', price: 1.5 },
    { id: 'doubleespresso', name: 'Double Espresso', price: 2.0 },
];

const CafeMenuArx: React.FC = () => {
    const router = useRouter();
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [txId, setTxId] = useState<string | null>(null);
    const [challenge, setChallenge] = useState<string | null>(null);

    // after prepare-payment, we set txId & challenge
    useEffect(() => {
        const doPrepare = async () => {
            if (selectedItem) {
                setStatus('Preparing payment...');
                try {
                    const { results } = await api.post('/arx/prepare-payment', {
                        chipId: 'from-chip', // if your API needs a chipId, retrieve or encode it appropriately
                        amount: selectedItem.price,
                    });
                    setTxId(results.txId);
                    setChallenge(results.challenge);
                    setStatus(
                        `Ready: Tap to pay ${selectedItem.price.toFixed(2)} credits for ${selectedItem.name}`
                    );
                } catch (err: any) {
                    setStatus(err.response?.data?.error || err.message);
                }
            }
        };
        doPrepare();
    }, [selectedItem]);

    const handleSignAndPay = async () => {
        if (!txId || !challenge) return;
        setStatus('Waiting for chip signature...');
        try {
            // Use execHaloCmdWeb to sign the challenge with key #1
            const cmd = { name: 'sign', keyNo: 1, message: challenge };
            const res = await execHaloCmdWeb(cmd);
            const signature = res.signature; // base64 or hex per API
            setStatus('Submitting payment...');
            const { results } = await api.post('/arx/confirm-payment', { txId, signature });
            if (results.success) {
                setStatus(`Payment successful! New balance: ${results.newBalance}`);
            } else {
                setStatus(`Payment failed: ${results.details}`);
            }
        } catch (e: any) {
            setStatus(`Error: ${e.message || e}`);
        } finally {
            // reset state after a short delay
            setTimeout(() => {
                setSelectedItem(null);
                setTxId(null);
                setChallenge(null);
                setStatus(null);
            }, 3000);
        }
    };

    return (
        <>
            <Head>
                <title>Café Menu – ARX Tap to Pay</title>
            </Head>
            <main className="relative max-w-4xl mx-auto p-6">
                <h1 className="text-4xl font-bold mb-4">Café Menu (ARX)</h1>
                {status && <div className="mb-4 text-lg">{status}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition"
                        >
                            <div className="text-2xl font-semibold mb-2">{item.name}</div>
                            <div className="text-xl">{item.price.toFixed(2)} credits</div>
                        </button>
                    ))}
                </div>

                {/* Modal Overlay */}
                {selectedItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-sm w-full text-center">
                            <h2 className="text-xl font-semibold mb-4">
                                {challenge
                                    ? `Tap to pay ${selectedItem.price.toFixed(2)} credits for ${selectedItem.name}`
                                    : 'Initializing transaction...'}
                            </h2>

                            <button
                                onClick={handleSignAndPay}
                                disabled={!challenge}
                                className={`w-full mt-4 px-6 py-2 rounded-lg transition \${
                  challenge ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-700 cursor-not-allowed'
                }`}
                            >
                                {challenge ? 'Tap & Pay' : 'Loading...'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedItem(null);
                                    setStatus(null);
                                    setTxId(null);
                                    setChallenge(null);
                                }}
                                className="w-full mt-2 px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
};

export default CafeMenuArx;
