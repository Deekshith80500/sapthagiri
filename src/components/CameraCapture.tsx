import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { faceService } from '../lib/faceVerification';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  title: string;
  profilePhoto?: string; // If provided, we verify the face
}

export default function CameraCapture({ onCapture, onClose, title, profilePhoto }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ match: boolean; confidence: number } | null>(null);

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

  const capturePhoto = async () => {
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

        if (profilePhoto) {
          setVerifying(true);
          setError('');
          try {
            const result = await faceService.verifyMatch(profilePhoto, dataUrl);
            setVerificationResult(result);
            if (!result.match) {
              setError(`Mismatch! Profile does not match captured face.`);
            }
          } catch (e: any) {
            setError(e.message || 'Face verification failed. Please try again.');
          } finally {
            setVerifying(false);
          }
        }
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setError('');
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      if (profilePhoto && (!verificationResult || !verificationResult.match)) {
        setError('Cannot confirm: Face mismatch or verification pending.');
        return;
      }
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
          <div>
            <h3 className="font-bold text-gray-800">{title}</h3>
            {profilePhoto && <p className="text-[10px] text-brand font-bold uppercase tracking-widest">Biometric Verification Active</p>}
          </div>
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
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-dashed border-white/50 rounded-[20%]" />
              </div>
              {error && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white bg-red-500/40 backdrop-blur-sm">
                  <p className="font-bold">{error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="relative w-full h-full">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className={`w-full h-full object-cover ${verifying ? 'opacity-50 grayscale' : ''}`}
              />
              <AnimatePresence>
                {verifying && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-brand/10 backdrop-blur-[2px]"
                  >
                    <Loader2 size={48} className="text-brand animate-spin mb-4" />
                    <p className="text-white font-black tracking-widest uppercase bg-brand px-4 py-2 rounded-full">Analyzing Face...</p>
                  </motion.div>
                )}
                {verificationResult && (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`absolute top-4 right-4 p-3 rounded-2xl flex items-center gap-2 shadow-lg ${
                      verificationResult.match ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {verificationResult.match ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {verificationResult.match ? `MATCH: ${Math.round(verificationResult.confidence)}%` : 'MISMATCH'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              {error && !verifying && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white bg-red-500/60 backdrop-blur-sm">
                  <div className="bg-white/10 p-6 rounded-3xl">
                    <ShieldAlert size={48} className="mx-auto mb-4" />
                    <p className="font-bold mb-2">VERIFICATION FAILED</p>
                    <p className="text-xs opacity-90">{error}</p>
                  </div>
                </div>
              )}
            </div>
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
                disabled={verifying}
                className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={24} />
              </button>
              <button 
                onClick={handleConfirm}
                disabled={verifying || (profilePhoto && !verificationResult?.match)}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                  verificationResult?.match 
                    ? 'bg-green-500 shadow-green-500/40 hover:scale-105 active:scale-95' 
                    : 'bg-gray-300 shadow-none'
                }`}
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
