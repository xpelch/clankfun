"use client"

import { useState } from "react";
import { env } from "~/env";
import { useToast } from "~/hooks/use-toast";

type Props = {
  onImage: (url: string | null) => void;
}

export function FImageUpload({
  onImage
}: Props) {
  const [uploadingImage, setUploadingImage] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const { toast } = useToast()

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      if (!event.target.files[0]) {
        return;
      }
      const file = event.target.files[0];
      setUploadingImage(file);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "image");

      try {
        onImage("https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/692f73fc-1b97-48a6-b356-ccbba0783400/original")
        setImage("https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/692f73fc-1b97-48a6-b356-ccbba0783400/original")
        // console.log("Uploading image...");
        // const response = await fetch("https://api.imgur.com/3/image", {
        //   method: "POST",
        //   headers: {
        //     Authorization: `Client-ID ${env.NEXT_PUBLIC_IMGUR_CLIENT_ID}`,
        //   },
        //   body: formData,
        // });

        // if (!response.ok) {
        //   throw new Error(`Failed to upload image: ${response.status}`);
        // }

        // const data = await response.json();
        // onImage(data.data.link);
        // setImage(data.data.link);
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Failed to upload image",
          description: "Please try again later",
        });
        console.error("Error uploading image:", error);
        onImage(null);
      } finally {
        setUploadingImage(null);
      }
    }
  };

  return (
    <div className="w-full">
      {!uploadingImage && <label
        htmlFor="image-upload"
        className="w-full h-[200px] flex flex-col items-center justify-center gap-2 rounded-lg bg-white/10 px-2 cursor-pointer"
      >
        <div className="h-6 w-6" />
        <div className="font-['Geist'] text-[15px] font-medium leading-[15px] text-white">
          Click to upload or drag and drop
        </div>
        <div className="text-center font-['Geist'] text-xs font-normal leading-3 text-white/50">
          PNG, JPG or GIF
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
      </label>}
      {uploadingImage && (
        <div className="w-full h-[200px] flex items-center justify-center gap-2 rounded-lg bg-white/10 px-2">
          <div className="h-6 w-6" />
          <div className="animate-pulse font-['Geist'] text-[15px] font-medium leading-[15px] text-white">
            Uploading image...
          </div>
        </div>  
      )}
    </div>
  );
}