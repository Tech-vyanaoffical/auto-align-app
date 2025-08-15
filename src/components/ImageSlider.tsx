import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ImageSliderProps {
  images: string[];
  alt: string;
  className?: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images, alt, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover rounded-lg"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 opacity-75 hover:opacity-100"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <img
              src={images[0]}
              alt={alt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-300"
        />
        
        {/* Navigation Buttons */}
        <Button
          variant="secondary"
          size="sm"
          onClick={prevImage}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-75 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={nextImage}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-75 hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Fullscreen Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 opacity-75 hover:opacity-100"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <div className="relative">
              <img
                src={images[currentIndex]}
                alt={`${alt} - Image ${currentIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={prevImage}
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={nextImage}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Counter */}
        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-primary shadow-lg' 
                  : 'border-transparent hover:border-muted-foreground'
              }`}
            >
              <img
                src={image}
                alt={`${alt} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;