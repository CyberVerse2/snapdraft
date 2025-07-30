'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);

      // In a real app, you'd upload to a cloud storage service
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setIsUploading(false);
      onImageUpload(dataUrl);
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <div className="flex flex-col md:flex-row w-full gap-8 items-stretch">
      {/* Upload Area (left) */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        <div className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000000] flex flex-col items-center justify-center w-full h-full py-12">
          <div
            {...getRootProps()}
            className={`cursor-pointer transition-all ${
              isDragActive
                ? 'bg-yellow-400 shadow-[8px_8px_0px_0px_#000000]'
                : ' hover:bg-yellow-200 hover:shadow-[8px_8px_0px_0px_#000000]'
            } w-full`}
          >
            <div className="flex flex-col items-center justify-center py-16">
              <input {...getInputProps()} />

              {preview ? (
                <div className="text-center space-y-6">
                  <div className="relative w-80 h-80 mx-auto border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
                    <Image
                      src={preview || '/placeholder.svg'}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="bg-green-400 text-black px-6 py-3 border-4 border-black font-black text-xl uppercase">
                    IMAGE LOCKED & LOADED!
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 mx-auto bg-black flex items-center justify-center border-4 border-black">
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
                    ) : (
                      <Upload className="h-12 w-12 text-white" />
                    )}
                  </div>

                  <div>
                    <div className="bg-black text-white px-6 py-4 border-4 border-black font-black text-2xl uppercase mb-4">
                      {isDragActive ? 'DROP IT NOW!' : 'UPLOAD IMAGE'}
                    </div>
                    <p className="text-lg font-bold uppercase tracking-wide">
                      PNG, JPG, WEBP • MAX 10MB
                    </p>
                  </div>

                  <button className="bg-red-500 text-white px-8 py-4 border-4 border-black font-black text-xl uppercase hover:bg-red-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all">
                    <ImageIcon className="w-6 h-6 mr-3 inline" />
                    CHOOSE FILE
                  </button>
                </div>
              )}
            </div>
          </div>
          {preview && (
            <div className="text-center mt-6">
              <div className="bg-lime-400 text-black px-6 py-3 border-4 border-black font-black text-lg uppercase inline-block">
                READY FOR STYLING!
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Sample Image Area (right) */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        <div className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000000] flex flex-col items-center justify-center w-full h-full py-12">
          <button
            type="button"
            onClick={() =>
              onImageUpload(
                'https://fortune.com/img-assets/wp-content/uploads/2024/05/JessePollack-Base-044.jpg?w=1440&q=90'
              )
            }
            className="bg-blue-500 text-white px-10 py-5 border-4 border-black font-black text-xl uppercase hover:bg-blue-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all rounded-lg mb-8"
          >
            USE SAMPLE IMAGE
          </button>
          <div
            className="w-48 h-48 border-4 border-black rounded-lg overflow-hidden cursor-pointer hover:shadow-[8px_8px_0px_0px_#000000] transition-all relative flex items-center justify-center mb-4"
            onClick={() =>
              onImageUpload(
                'https://fortune.com/img-assets/wp-content/uploads/2024/05/JessePollack-Base-044.jpg?w=1440&q=90'
              )
            }
            title="Click to use this sample image"
          >
            <Image
              src="https://fortune.com/img-assets/wp-content/uploads/2024/05/JessePollack-Base-044.jpg?w=1440&q=90"
              alt="Sample"
              fill
              className="object-cover"
              sizes="192px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="text-center font-bold text-lg mt-2">Sample Image</div>
        </div>
      </div>
    </div>
  );
}
