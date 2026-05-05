import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  title: string;
}

export default function CameraCapture({ onCapture, onClose, title }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="relative aspect-square bg-gray-900 border-x border-gray-100">
          {!capturedImage ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              {error && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white bg-red-500/20 backdrop-blur-sm">
                  <p className="font-medium">{error}</p>
                </div>
              )}
            </>
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-8 flex items-center justify-center gap-6">
          {!capturedImage ? (
            <button 
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Camera size={32} />
            </button>
          ) : (
            <>
              <button 
                onClick={handleRetake}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw size={24} />
              </button>
              <button 
                onClick={handleConfirm}
                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/40 hover:scale-105 active:scale-95 transition-all"
              >
                <Check size={32} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
