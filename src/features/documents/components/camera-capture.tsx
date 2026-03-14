"use client";

import { useRef, useState, useCallback } from "react";
import { Aperture, VideoCamera, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch {
      setError(
        "Camera access denied. Please allow camera permission or use file upload instead.",
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    onOpenChange(nextOpen);
  }

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
        if (!blob) return;
        const file = new File(
          [blob],
          `scan_${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`,
          { type: "image/jpeg" },
        );
        stopCamera();
        onCapture(file);
        onOpenChange(false);
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-neutral-200 bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal tracking-tight">
            Capture Document
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Position the document within the frame and capture.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 p-12">
              <X size={32} className="mb-2 text-neutral-300" />
              <p className="text-center text-sm text-neutral-500">{error}</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full object-cover"
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <VideoCamera
                    size={40}
                    weight="thin"
                    className="animate-pulse text-neutral-500"
                  />
                </div>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-neutral-200"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCapture}
              disabled={!isStreaming}
              className="bg-black text-white hover:bg-neutral-800"
            >
              <Aperture size={16} weight="bold" />
              Capture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

