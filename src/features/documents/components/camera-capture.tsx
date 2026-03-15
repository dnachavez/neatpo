"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "@phosphor-icons/react";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({
  open,
  onOpenChange,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1920, height: 1080 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch {
      setError("Unable to access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  function handleCapture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File(
            [blob],
            `scan-${Date.now()}.jpg`,
            { type: "image/jpeg" },
          );
          onCapture(file);
          onOpenChange(false);
        }
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-neutral-200 bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            Camera Scan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="flex flex-col items-center rounded-lg border border-neutral-200 py-12">
              <X size={32} className="mb-2 text-neutral-300" />
              <p className="text-sm text-neutral-500">{error}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-auto w-full"
              />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-neutral-200"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCapture}
              disabled={!stream}
              className="bg-black text-white hover:bg-neutral-800"
            >
              <Camera size={16} weight="bold" />
              Capture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
