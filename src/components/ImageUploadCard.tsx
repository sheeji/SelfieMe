
"use client";

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, UploadCloud, XCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    // Reset input value to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerCameraInput = () => cameraInputRef.current?.click();

  const clearImage = () => {
    setImagePreview(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    toast({
      title: "Image Cleared",
      description: "The selected image has been removed.",
    });
  };
  
  // Effect to update preview if an external source changes the image (e.g. parent component sets it)
  // This is not strictly necessary for this app's flow but good for robustness
  // For now, we'll let parent control via onImageSelected and it re-renders with new prop if needed.

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <CardDescription>{description}{acceptCriteria && <span className="block text-xs text-muted-foreground mt-1">Accepted content: {acceptCriteria}</span>}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          id={`${idPrefix}-camera`}
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id={`${idPrefix}-upload`}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={triggerCameraInput} className="flex-1 group">
            <Camera className="mr-2 h-4 w-4 group-hover:animate-pulse" /> Take Photo
          </Button>
          <Button variant="outline" onClick={triggerFileInput} className="flex-1 group">
            <UploadCloud className="mr-2 h-4 w-4 group-hover:animate-bounce" /> Upload Image
          </Button>
        </div>
      </CardContent>
      {imagePreview && (
        <CardFooter>
          <Button variant="ghost" onClick={clearImage} className="text-destructive hover:text-destructive-foreground hover:bg-destructive w-full">
            <XCircle className="mr-2 h-4 w-4" /> Clear Image
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
