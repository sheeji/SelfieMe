
"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, UploadCloud, XCircle, Image as ImageIcon, Video, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImageUploadCardProps {
  title: string;
  description: string;
  onImageSelected: (imageDataUrl: string | null) => void;
  idPrefix: string;
  acceptCriteria?: string;
  dataAiHint?: string;
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function ImageUploadCard({ title, description, onImageSelected, idPrefix, acceptCriteria, dataAiHint }: ImageUploadCardProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const [isCameraModeActive, setIsCameraModeActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);


  useEffect(() => {
    // This variable will hold the stream started by this specific effect run.
    let effectStream: MediaStream | null = null;
    // Flag to check if component is still mounted during async operations.
    let componentIsMounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!componentIsMounted) {
          // If component unmounted while waiting for permission, stop the acquired stream.
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        effectStream = stream;
        setActiveStream(stream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn("Video play failed:", e));
        }
      } catch (error) {
        if (!componentIsMounted) return;
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
        setIsCameraModeActive(false); // Turn off camera mode on error
      }
    };

    const stopActiveCamera = () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        setActiveStream(null);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        // Check if srcObject is a MediaStream before calling getTracks
        if (videoRef.current.srcObject instanceof MediaStream) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = null;
      }
      setHasCameraPermission(null); // Reset permission display
    };

    if (isCameraModeActive) {
      startCamera();
    } else {
      stopActiveCamera();
    }

    return () => {
      componentIsMounted = false;
      // Cleanup: stop the stream that THIS effect instance started.
      if (effectStream) {
        effectStream.getTracks().forEach(track => track.stop());
      }
      // If isCameraModeActive was true when unmounting, the main 'activeStream' might still need cleanup
      // if 'effectStream' hadn't been set yet (e.g. during await) or if they differ.
      // The 'else' block handles when isCameraModeActive becomes false before unmount.
      // This is a failsafe for unmounting while camera was intended to be active.
      if (isCameraModeActive && activeStream && activeStream !== effectStream) {
        activeStream.getTracks().forEach(track => track.stop());
        // Note: setActiveStream(null) here might cause warning if component is already unmounted
      }
    };
  }, [isCameraModeActive, toast]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }
      try {
        const dataUri = await fileToDataUri(file);
        setImagePreview(dataUri);
        onImageSelected(dataUri);
      } catch (error) {
        toast({
          title: "Error processing image",
          description: "Could not read the image file.",
          variant: "destructive",
        });
        console.error("Error converting file to data URI:", error);
      }
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleTakePhotoClick = () => {
    setImagePreview(null);
    onImageSelected(null);
    setHasCameraPermission(null); 
    setIsCameraModeActive(true);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current && activeStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');
        setImagePreview(dataUri);
        onImageSelected(dataUri);
      }
      setIsCameraModeActive(false); 
    }
  };

  const handleCloseCameraView = () => {
    setIsCameraModeActive(false);
  };

  const clearImage = () => {
    setImagePreview(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (isCameraModeActive) {
      handleCloseCameraView();
    }
    toast({
      title: "Image Cleared",
      description: "The selected image/camera view has been cleared.",
    });
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}{acceptCriteria && <span className="block text-xs text-muted-foreground mt-1">Accepted content: {acceptCriteria}</span>}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        {isCameraModeActive ? (
          <div className="space-y-4">
            <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden border border-dashed relative">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden"></canvas>
              {!activeStream && hasCameraPermission === null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                  <Video size={48} className="text-muted-foreground animate-pulse mb-2" />
                  <p className="text-muted-foreground">Starting camera...</p>
                </div>
              )}
            </div>
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  To take a photo, please enable camera permissions in your browser settings and try again.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleCapturePhoto} className="flex-1" disabled={!activeStream || hasCameraPermission === false}>
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
              <Button variant="outline" onClick={handleCloseCameraView} className="flex-1">
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center overflow-hidden border border-dashed">
              {imagePreview ? (
                <Image src={imagePreview} alt={`${title} preview`} width={400} height={225} className="object-contain h-full w-full" />
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  <ImageIcon size={48} className="mx-auto mb-2" />
                  <p>Image Preview</p>
                  <Image src={`https://placehold.co/400x225.png`} alt="Placeholder" width={400} height={225} className="opacity-0 absolute -z-10" data-ai-hint={dataAiHint || "placeholder image"}/>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={`${idPrefix}-upload`}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleTakePhotoClick} className="flex-1 group">
                <Camera className="mr-2 h-4 w-4 group-hover:animate-pulse" /> Take Photo
              </Button>
              <Button variant="outline" onClick={triggerFileInput} className="flex-1 group">
                <UploadCloud className="mr-2 h-4 w-4 group-hover:animate-bounce" /> Upload Image
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {(imagePreview && !isCameraModeActive) && (
        <CardFooter>
          <Button variant="ghost" onClick={clearImage} className="text-destructive hover:text-destructive-foreground hover:bg-destructive w-full">
            <XCircle className="mr-2 h-4 w-4" /> Clear Image
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
