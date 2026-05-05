import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    scannerId?: string;
    onScan: (token: string) => void;
    onClose?: () => void;
    className?: string;
}

export function QRScanner({ scannerId: propId, onScan, onClose, className = '' }: QRScannerProps) {
    const fallbackId = useId();
    const scannerId = propId ?? `qr-scanner-${fallbackId.replace(/:/g, '')}`;
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const startingRef = useRef(false);

    // Use ref for onScan to avoid restarting camera when callback identity changes
    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;

    useEffect(() => {
        let cancelled = false;

        const cleanup = async () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        await scannerRef.current.stop();
                    }
                } catch { /* ignore */ }
                try { scannerRef.current.clear(); } catch { /* ignore */ }
                scannerRef.current = null;
            }
            // Clear any leftover DOM elements from previous instances
            const el = document.getElementById(scannerId);
            if (el) el.innerHTML = '';
        };

        const start = async () => {
            // Prevent concurrent starts (StrictMode double-mount)
            if (startingRef.current) return;
            startingRef.current = true;

            try {
                // Always clean up any previous instance first
                await cleanup();
                if (cancelled) return;

                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 5,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        if (cancelled || !scannerRef.current) return;
                        onScanRef.current(decodedText.trim());
                    },
                    () => { /* ignore scan errors (no code in frame) */ }
                );
                if (!cancelled) setError(null);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Không thể mở camera';
                if (!cancelled) setError(msg);
            } finally {
                startingRef.current = false;
                if (!cancelled) setIsStarting(false);
            }
        };

        start();

        return () => {
            cancelled = true;
            cleanup();
        };
    }, [scannerId]);

    const handleClose = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch { /* ignore */ }
            scannerRef.current = null;
        }
        onClose?.();
    };

    return (
        <div className={className}>
            {isStarting && (
                <p className="text-sm text-gray-500 mb-2">Đang bật camera...</p>
            )}
            {error && (
                <div className="mb-2 p-2 rounded bg-red-50 text-red-700 text-sm">
                    {error}
                </div>
            )}
            <div id={scannerId} className="max-w-[300px] overflow-hidden rounded-lg" />
            <button
                type="button"
                onClick={handleClose}
                className="mt-3 px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
                Đóng camera
            </button>
        </div>
    );
}
