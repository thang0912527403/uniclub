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

        const stopScanner = async () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        await scannerRef.current.stop();
                    }
                } catch { /* ignore */ }
                try { scannerRef.current.clear(); } catch { /* ignore */ }
                scannerRef.current = null;
            }
            const el = document.getElementById(scannerId);
            if (el) el.innerHTML = '';
        };

        const start = async () => {
            // Prevent concurrent starts (StrictMode double-mount)
            if (startingRef.current) {
                console.log('[QRScanner] Already starting, skip');
                return;
            }
            startingRef.current = true;
            console.log('[QRScanner] Starting camera...');

            try {
                await stopScanner();
                if (cancelled) return;

                // Wait for DOM element to be rendered
                await new Promise(resolve => setTimeout(resolve, 150));
                if (cancelled) return;

                const container = document.getElementById(scannerId);
                if (!container) {
                    throw new Error('Không tìm thấy vùng hiển thị camera');
                }

                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                const scanConfig = {
                    fps: 10,
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                        const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
                        return { width: Math.floor(size), height: Math.floor(size) };
                    },
                    aspectRatio: 1.0,
                };
                const onSuccess = (decodedText: string) => {
                    if (cancelled || !scannerRef.current) return;
                    onScanRef.current(decodedText.trim());
                };
                const onError = () => { /* no QR in frame — ignore */ };

                // Try rear camera → front camera → any camera
                let started = false;
                for (const constraint of [
                    { facingMode: 'environment' },
                    { facingMode: 'user' },
                ] as MediaTrackConstraints[]) {
                    if (started || cancelled) break;
                    try {
                        await html5QrCode.start(constraint, scanConfig, onSuccess, onError);
                        started = true;
                        console.log('[QRScanner] Camera started with', constraint);
                    } catch (e) {
                        console.warn('[QRScanner] Failed with', constraint, e);
                    }
                }

                // Last resort: enumerate devices
                if (!started && !cancelled) {
                    const devices = await Html5Qrcode.getCameras();
                    console.log('[QRScanner] Available cameras:', devices);
                    if (!devices.length) throw new Error('Không tìm thấy camera nào');
                    await html5QrCode.start(devices[0].id, scanConfig, onSuccess, onError);
                    started = true;
                    console.log('[QRScanner] Camera started with device', devices[0].id);
                }

                if (!cancelled) setError(null);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Không thể mở camera';
                console.error('[QRScanner] Camera error:', e);
                if (!cancelled) setError(msg);
            } finally {
                startingRef.current = false;
                if (!cancelled) setIsStarting(false);
            }
        };

        start();

        return () => {
            cancelled = true;
            startingRef.current = false;
            stopScanner();
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
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Đang bật camera...</p>
                </div>
            )}
            {error && (
                <div className="mb-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <p className="font-medium mb-1">⚠️ Lỗi camera</p>
                    <p>{error}</p>
                    <p className="text-xs text-red-500 mt-2">
                        Hãy đảm bảo truy cập qua HTTPS hoặc localhost và đã cấp quyền camera cho trình duyệt.
                    </p>
                </div>
            )}
            <div id={scannerId} style={{ width: '100%', maxWidth: 400 }} className="overflow-hidden rounded-lg" />
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
