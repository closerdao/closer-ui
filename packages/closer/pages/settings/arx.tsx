import React, { useState } from 'react';
import Head from 'next/head';
import { NextPageContext } from 'next';
import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web';
import { Button } from '../../components/ui';
import Heading from '../../components/ui/Heading';
import PageNotFound from '../not-found';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
    messages: Record<string, any> | null;
}

const SettingsPage: React.FC<Props> = () => {
    const { user, isAuthenticated, refetchUser } = useAuth();
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isAuthenticated || !user) {
        return <PageNotFound error="Please log in to access settings." />;
    }

    const connectBadge = async () => {
        setLoading(true);
        setStatus('Waiting for badge tap...');
        try {
            // Use a dummy message to invoke the sign command, which returns chip metadata
            const dummyMessage = '00'; // or any placeholder
            const { signature, tagUid, uid, keyNo } = await execHaloCmdWeb(
                { name: 'sign', keyNo: 1, message: dummyMessage },
            );
            // tagUid or uid contains the chip identifier (depending on platform)
            const chipId = tagUid || uid;
            if (!chipId) {
                throw new Error('Could not read chip UID from device metadata');
            }
            setStatus('Registering badge...');
            await api.post('/arx/connect', { chipId });
            await refetchUser();
            setStatus('Badge connected successfully');
        } catch (e: any) {
            // Display any HALO or network errors
            setStatus(`Error: ${e.name || e.message}`);
            console.error('connectBadge error:', e);
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const disconnectBadge = async () => {
        setLoading(true);
        setStatus('Disconnecting badge...');
        try {
            await api.post('/arx/disconnect');
            await refetchUser();
            setStatus('Badge disconnected');
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
            console.error('disconnectBadge error:', e);
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    return (
        <>
            <Head>
                <title>Settings</title>
            </Head>
            <div className="max-w-md mx-auto p-8 space-y-6">
                <Heading level={2}>🎫 ARX Badge Settings</Heading>
                {status && <div className="text-sm text-gray-700">{status}</div>}
                {user.arxChipId ? (
                    <Button onClick={disconnectBadge} isEnabled={!loading} variant="danger">
                        {loading ? 'Processing...' : 'Disconnect Badge'}
                    </Button>
                ) : (
                    <Button onClick={connectBadge} isEnabled={!loading} variant="primary">
                        {loading ? 'Processing...' : 'Connect Badge'}
                    </Button>
                )}
            </div>
        </>
    );
};

SettingsPage.getInitialProps = async (context: NextPageContext) => {
    try {
        const messages = await loadLocaleData(context.locale, process.env.NEXT_PUBLIC_APP_NAME);
        return { messages };
    } catch {
        return { messages: null };
    }
};

export default SettingsPage;
