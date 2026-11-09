import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, QrCode, Upload, Check } from 'lucide-react';

export default function QrBarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
  title = 'Escanear Código QR o Código de Barras',
}) {
  const rawId = useId();
  const readerId = `qr-barcode-reader-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const scannerRef = useRef(null);
  const [errorCamara, setErrorCamara] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [escaneando, setEscaneando] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelado = false;
    setErrorCamara('');
    setEscaneando(true);

    const iniciarEscaneo = async () => {
      try {
        const html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (cancelado) return;
            onDetected(decodedText.trim());
            onClose();
          },
          () => {
            // Ignorar frames sin código detectado
          }
        );
      } catch (err) {
        if (!cancelado) {
          setEscaneando(false);
          setErrorCamara(
            'No se pudo acceder a la cámara en vivo (verifica permisos del navegador o sube una foto del código QR / código de barras abajo).'
          );
        }
      }
    };

    const timer = setTimeout(iniciarEscaneo, 120);

    return () => {
      cancelado = true;
      clearTimeout(timer);
      if (scannerRef.current) {
        const inst = scannerRef.current;
        scannerRef.current = null;
        if (inst.isScanning) {
          inst
            .stop()
            .then(() => inst.clear())
            .catch(() => {});
        } else {
          try {
            inst.clear();
          } catch {
            // ignore
          }
        }
      }
    };
  }, [isOpen, readerId, onDetected, onClose]);

  const handleScanImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorCamara('');
    try {
      const html5QrCode = scannerRef.current || new Html5Qrcode(readerId);
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      const decodedText = await html5QrCode.scanFile(file, true);
      onDetected(decodedText.trim());
      onClose();
    } catch {
      setErrorCamara(
        'No se detectó un código QR o código de barras nítido en la imagen seleccionada.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D261A]/40 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-emerald-100 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100 bg-[#F6F9F7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E7F5ED] text-[#1B5E43] flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                LECTOR ÓPTICO
              </p>
              <h3 className="text-sm font-bold text-[#14281D]">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#526B5C] hover:bg-emerald-100/70"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-emerald-200 bg-[#FAFDFB] min-h-[220px] flex flex-col items-center justify-center relative">
            <div id={readerId} className="w-full" />
            {!escaneando && errorCamara && (
              <div className="p-5 text-center space-y-2">
                <Camera size={28} className="mx-auto text-[#1B5E43]" />
                <p className="text-xs text-[#526B5C] leading-relaxed">{errorCamara}</p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-center text-[#526B5C]">
            Apunta la cámara hacia el <strong>Código QR</strong> o <strong>Código de Barras</strong> de la placa de universidad, serie del laboratorio o equipo.
          </p>

          {/* Opción de escanear desde imagen o pistola lectora / manual */}
          <div className="pt-2 border-t border-emerald-100 space-y-3">
            <label className="w-full py-2.5 px-4 rounded-xl bg-[#EEF6F1] text-[#1B5E43] hover:bg-emerald-100 transition-colors text-xs font-semibold cursor-pointer flex items-center justify-center gap-2">
              <Upload size={15} />
              Escanear desde foto de QR / Código de Barras
              <input
                type="file"
                accept="image/*"
                onChange={handleScanImageFile}
                className="hidden"
              />
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && codigoManual.trim()) {
                    e.preventDefault();
                    onDetected(codigoManual.trim());
                    onClose();
                  }
                }}
                placeholder="O usa lector USB / escribe el código aquí..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!codigoManual.trim()) return;
                  onDetected(codigoManual.trim());
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1"
              >
                <Check size={14} /> Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
