import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Image, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  label?: string;
  accepted?: string;
}

export default function CameraCapture({ onCapture, label = 'Adjuntar imagen', accepted = 'image/*' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState<{ url: string; blob: Blob } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setActive(true);
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setActive(true);
      } catch {
        setError('No se pudo acceder a la cámara. Usa la opción de subir archivo.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPending({ url, blob });
      }
    }, 'image/jpeg', 0.9);
  }, []);

  const confirm = useCallback(() => {
    if (!pending) return;
    URL.revokeObjectURL(pending.url);
    setPending(null);
    onCapture(pending.blob);
  }, [onCapture, pending]);

  const retake = useCallback(() => {
    if (pending) {
      URL.revokeObjectURL(pending.url);
    }
    setPending(null);
  }, [pending]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPending({ url, blob: file });
  }, []);

  if (pending) {
    return (
      <div className="border border-[#d8e0dc] rounded-md overflow-hidden bg-white flex flex-col">
        <img src={pending.url} alt="Vista previa" className="w-full h-auto max-h-[400px] object-cover" />
        <div className="p-4 flex items-center justify-between gap-3 border-t border-[#d8e0dc] bg-[#f4f6f5]">
          <Button variant="outline" onClick={retake} className="flex-1 text-[#5f7b6f]">
            <RefreshCw className="h-4 w-4 mr-2" /> Volver a tomar
          </Button>
          <Button onClick={confirm} className="flex-1 bg-[#0c1512] text-white">
            Usar esta foto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-md border border-[#fca5a5] bg-[#fff1f2] text-[11px] text-[#991b1b]">
          {error}
        </div>
      )}
      {!active && (
        <div className="border border-dashed border-[#d8e0dc] hover:border-[#0c1512] bg-[#fcfdfd] rounded-md p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group" onClick={startCamera}>
          <Camera className="h-8 w-8 mb-3 text-[#5f7b6f] group-hover:text-[#0c1512] transition-colors" />
          <h3 className="text-base font-semibold text-[#0c1512] mb-1">{label}</h3>
          <p className="text-[#5f7b6f] text-sm max-w-sm mb-4">Captura desde tu cámara o sube un archivo</p>
          <div className="flex gap-3">
            <Button className="bg-[#0c1512] text-white shadow-none rounded-md px-6">
              Activar Cámara
            </Button>
            <label className="flex items-center">
              <Upload className="h-4 w-4 mr-2 text-[#5f7b6f]" />
              <input type="file" accept={accepted} className="sr-only" onChange={handleFile} />
              Subir archivo
            </label>
          </div>
        </div>
      )}
      {active && (
        <div className="border border-[#d8e0dc] rounded-md overflow-hidden bg-white relative">
          <video ref={videoRef} className="w-full h-auto max-h-[500px] object-cover" autoPlay playsInline />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 flex items-end justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            <div className="flex gap-3">
              <Button variant="ghost" onClick={stopCamera} className="text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
              <label className="flex items-center cursor-pointer">
                <Image className="h-4 w-4 mr-2 text-white" />
                <input type="file" accept={accepted} className="sr-only" onChange={handleFile} />
                Subir
              </label>
            </div>
            <Button onClick={capture} className="bg-white text-[#0c1512] shadow-none rounded-full p-4">
              <div className="h-10 w-10 rounded-full border-4 border-[#0c1512]/30" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
