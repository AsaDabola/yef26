import React, { useRef, useState } from 'react';
import { Camera, X, Check, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg'));
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const blob = await (await fetch(capturedImage)).blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onCapture(file_url);
      handleClose();
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onCapture(file_url);
      handleClose();
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      <div className="flex-1 relative">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="bg-black/80 backdrop-blur p-6 space-y-4">
        {!capturedImage ? (
          <div className="flex items-center justify-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="rounded-full w-14 h-14" disabled={uploading} asChild>
                <span>
                  <Upload className="w-6 h-6" />
                </span>
              </Button>
            </label>
            <Button
              onClick={capturePhoto}
              className="rounded-full w-20 h-20 bg-white hover:bg-gray-100"
              disabled={uploading}
            >
              <Camera className="w-8 h-8 text-black" />
            </Button>
            <Button variant="outline" onClick={handleClose} className="rounded-full w-14 h-14" disabled={uploading}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={() => setCapturedImage(null)} className="rounded-full w-14 h-14">
              <X className="w-6 h-6" />
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="rounded-full w-20 h-20 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}