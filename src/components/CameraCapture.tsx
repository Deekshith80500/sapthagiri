import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, ShieldCheck, ShieldAlert, Loader2, Zap } from 'lucide-react';
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
      if (profilePhoto && verificationResult && !verificationResult.match) {
        setError('Cannot confirm: Face mismatch.');
        return;
      }
      onCapture(capturedImage);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const canConfirm = capturedImage && !verifying && (!profilePhoto || (verificationResult && verificationResult.match));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl relative border-4 border-white">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-10 p-2">
            <Zap size={40} className="text-electric opacity-10 animate-zap" fill="currentColor" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black">{capturedImage ? 'Review Scan' : title}</h3>
            {profilePhoto && <p className="text-[10px] text-electric font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5"><Zap size={10} fill="currentColor" /> Biometric Grid Security</p>}
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:bg-white/20 transition-colors z-10">
            <X size={20} />
          </button>
        </div>

        <div className="relative aspect-square bg-slate-950">
          {!capturedImage ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-[60px] border-slate-950/60 pointer-events-none">
                <div className="w-full h-full border-4 border-dashed border-white/30 rounded-[32px] animate-pulse" />
              </div>
              {error && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white bg-rose-500/60 backdrop-blur-sm">
                  <p className="font-black text-sm uppercase tracking-wider">{error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="relative w-full h-full group">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className={`w-full h-full object-cover transition-all duration-500 ${verifying ? 'blur-md grayscale' : ''}`}
              />
              <AnimatePresence>
                {verifying && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-brand/20 backdrop-blur-md"
                  >
                    <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-2xl mb-4">
                      <Loader2 size={40} className="text-brand animate-spin" />
                    </div>
                    <p className="text-white font-black tracking-[0.3em] uppercase text-xs bg-brand px-6 py-3 rounded-full shadow-xl">Analyzing Identity</p>
                  </motion.div>
                )}
                {verificationResult && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`absolute bottom-6 left-6 right-6 p-4 rounded-[24px] flex items-center justify-between shadow-2xl backdrop-blur-xl border-2 ${
                      verificationResult.match ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        {verificationResult.match ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{verificationResult.match ? 'Verification Success' : 'Identity Mismatch'}</p>
                        <p className="font-black text-sm tracking-tight">{verificationResult.match ? `Confidence: ${Math.round(verificationResult.confidence)}%` : 'Try again'}</p>
                      </div>
                    </div>
                    {verificationResult.match && <Check size={24} strokeWidth={4} />}
                  </motion.div>
                )}
              </AnimatePresence>
              {error && !verifying && !verificationResult && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white bg-rose-500/80 backdrop-blur-sm">
                  <div className="bg-white/10 p-8 rounded-[32px] border border-white/20">
                    <ShieldAlert size={64} className="mx-auto mb-4" />
                    <p className="font-black text-xl mb-2">ERROR OCCURRED</p>
                    <p className="font-bold text-xs uppercase tracking-widest opacity-80">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-10 flex flex-col items-center gap-6">
          {!capturedImage ? (
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-[32px] bg-brand flex items-center justify-center text-white shadow-2xl shadow-brand/40 hover:scale-110 active:scale-95 transition-all group"
            >
              <div className="w-16 h-16 rounded-[24px] border-4 border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors">
                <Camera size={32} strokeWidth={3} />
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-6 w-full">
              <button 
                onClick={handleRetake}
                disabled={verifying}
                className="flex-1 py-5 bg-slate-100 rounded-[24px] flex items-center justify-center gap-3 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} strokeWidth={3} />
                Retake
              </button>
              <button 
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`flex-1 py-5 rounded-[24px] flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all ${
                  canConfirm 
                    ? 'bg-emerald-500 shadow-emerald-500/30 hover:scale-[1.02] active:scale-95' 
                    : 'bg-slate-200 text-slate-400 shadow-none grayscale cursor-not-allowed'
                }`}
              >
                <Check size={18} strokeWidth={4} />
                Confirm
              </button>
            </div>
          )}
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{capturedImage ? 'Ensure your face is clearly visible' : 'Center the face in the frame'}</p>
        </div>
      </div>
    </motion.div>
  );
}
