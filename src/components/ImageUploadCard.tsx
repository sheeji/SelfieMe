
"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, UploadCloud, XCircle, Image as ImageIcon, Video, AlertTriangle, CircleUserRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImageUploadCardProps {
  title: string;
  description: string;
  onImageSelected: (imageDataUrl: string | null) => void;
  idPrefix: string;
  acceptCriteria?: string; // e.g. "human, animal"
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
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isCameraModeActive) {
      const getCameraPermission = async () => {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(newStream);
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
          setIsCameraModeActive(false); // Close camera mode if permission denied
        }
      };
      getCameraPermission();
    } else {
      stopStream();
    }

    return () => {
      // Cleanup stream when component unmounts or camera mode is deactivated
      if (isCameraModeActive) {
        stopStream();
      }
    };
  }, [isCameraModeActive, toast, stopStream]);


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
        toast({
          title: "Image Selected",
          description: `${file.name} has been selected.`,
        });
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
    setImagePreview(null); // Clear any existing preview
    onImageSelected(null);
    setIsCameraModeActive(true);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to video's intrinsic dimensions for best quality
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');
        setImagePreview(dataUri);
        onImageSelected(dataUri);
        toast({
          title: "Photo Captured!",
        });
      }
      handleCloseCameraView();
    }
  };
  
  const handleCloseCameraView = () => {
    setIsCameraModeActive(false);
    // The useEffect cleanup will handle stopping the stream
  };

  const clearImage = () => {
    setImagePreview(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    handleCloseCameraView(); // Also close camera view if it's open
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
              {/* Hidden canvas for capturing frame */}
              <canvas ref={canvasRef} className="hidden"></canvas>
              {!stream && hasCameraPermission !== false && ( // Show loading/placeholder before stream starts but after permission requested
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
                  To take a photo, please enable camera permissions in your browser settings and refresh the page.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleCapturePhoto} className="flex-1" disabled={!stream || hasCameraPermission === false}>
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
                  {/* This placeholder helps with AI image search hints even when no image is selected */}
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

    