import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    /** Optional: custom element id (default: useId()) */
    scannerId?: string;
    /** Called when a QR code is successfully scanned; decoded text = token */
    onScan: (token: string) => void;
    /** Optional: called when scanner is closed */
    onClose?: () => void;
    /** Optional: class for the container */
    className?: string;
}

export function QRScanner({ scannerId: propId, onScan, onClose, className = '' }: QRScannerProps) {
    const fallbackId = useId();
    const scannerId = propId ?? `qr-scanner-${fallbackId.replace(/:/g, '')}`;
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        let mounted = true;
        const start = async () => {
            try {
                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        if (!mounted || !scannerRef.current) return;
                        onScan(decodedText.trim());
                    },
                    () => { /* ignore scan errors (no code in frame) */ }
                );
                if (mounted) setError(null);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Không thể mở camera';
                if (mounted) setError(msg);
            } finally {
                if (mounted) setIsStarting(false);
            }
        };

        start();
        return () => {
            mounted = false;
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(() => {});
            }
            scannerRef.current = null;
        };
    }, [scannerId, onScan]);

    const handleClose = () => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current = null;
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
