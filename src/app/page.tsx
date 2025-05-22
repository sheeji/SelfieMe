
"use client";

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploadCard } from '@/components/ImageUploadCard';
import { weaveImagesAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Download, Wand2, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ImageWeaverPage() {
  const [foregroundImage, setForegroundImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!foregroundImage) {
      toast({ title: "Missing Foreground Image", description: "Please upload a foreground image.", variant: "destructive" });
      return;
    }
    if (!backgroundImage) {
      toast({ title: "Missing Background Image", description: "Please upload a background image.", variant: "destructive" });
      return;
    }
    if (!textInput.trim()) {
      toast({ title: "Missing Text", description: "Please enter some text to sketch on the image.", variant: "destructive" });
      return;
    }

    setError(null);
    setFinalImage(null);

    startTransition(async () => {
      const result = await weaveImagesAction({
        foregroundImage,
        backgroundImage,
        text: textInput,
      });

      if (result.finalImage) {
        setFinalImage(result.finalImage);
        toast({ title: "Image Weaving Complete!", description: "Your masterpiece is ready." });
      } else if (result.error) {
        setError(result.error);
        toast({ title: "Weaving Failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleDownload = () => {
    if (!finalImage) return;
    const link = document.createElement('a');
    link.href = finalImage;
    
    // Try to determine file extension
    const mimeType = finalImage.substring(finalImage.indexOf(':') + 1, finalImage.indexOf(';'));
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `woven-image.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Started", description: "Your image is downloading." });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-8 bg-gradient-to-br from-background to-secondary/30">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-primary tracking-tight">Image Weaver</h1>
        <p className="text-muted-foreground mt-2 text-lg">Craft unique visuals by merging images and sketching text with AI.</p>
      </header>

      <main className="w-full max-w-5xl space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <ImageUploadCard
            title="Foreground Image"
            description="Upload an image with a person or animal."
            onImageSelected={setForegroundImage}
            idPrefix="foreground"
            acceptCriteria="Humans, animals, birds"
            dataAiHint="person animal"
          />
          <ImageUploadCard
            title="Background Image"
            description="Upload a background scene (no people/animals)."
            onImageSelected={setBackgroundImage}
            idPrefix="background"
            acceptCriteria="Landscapes, textures, abstract backgrounds"
            dataAiHint="landscape nature"
          />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Add Your Text</CardTitle>
            <CardDescription>Enter the text you want to see hand-sketched onto the image.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="text-input" className="sr-only">Text to sketch</Label>
            <Textarea
              id="text-input"
              placeholder="E.g., 'Dream Big', 'Adventure Awaits'..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={3}
              className="text-base"
            />
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isPending || !foregroundImage || !backgroundImage || !textInput.trim()}
            className="w-full max-w-xs text-lg py-6 shadow-lg hover:shadow-primary/40 transition-shadow duration-300 group"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-6 w-6 group-hover:animate-sparkle" /> 
            )}
            Weave Images
          </Button>
        </div>

        {isPending && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Processing Your Masterpiece...</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground">The AI is working its magic. This might take a moment.</p>
              <Skeleton className="h-[300px] w-full max-w-md rounded-lg" />
            </CardContent>
          </Card>
        )}

        {error && !isPending && (
          <Card className="shadow-lg border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Oops! Something Went Wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive-foreground">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">Please check your images and text, then try again. If the problem persists, the AI might be temporarily unavailable.</p>
            </CardContent>
          </Card>
        )}

        {finalImage && !isPending && (
          <Card className="shadow-xl border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Your Woven Image!</CardTitle>
              <CardDescription>Preview your AI-generated artwork below. You can download it or try new variations.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-2 sm:p-4 md:p-6">
              <Image
                src={finalImage}
                alt="Final woven image"
                width={800}
                height={450}
                className="rounded-lg shadow-2xl object-contain max-h-[70vh]"
                data-ai-hint="artistic abstract"
              />
            </CardContent>
            <CardFooter className="justify-center">
              <Button size="lg" onClick={handleDownload} className="group">
                <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" /> Download Image
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
      
      <footer className="mt-12 text-center text-sm text-muted-foreground py-4">
        <p>&copy; {new Date().getFullYear()} Image Weaver. Powered by Generative AI.</p>
      </footer>
      <style jsx global>{`
        @keyframes sparkle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; filter: brightness(1.5); }
        }
        .group-hover .animate-sparkle {
          animation: sparkle 0.7s ease-in-out;
        }
      `}</style>
    </div>
  );
}
