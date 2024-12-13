"use client"

import { useToast } from "~/hooks/use-toast";
import { UploadDropzone } from "~/lib/uploadthing";

type Props = {
  onImage: (url: string | null) => void;
}

export function FImageUpload({
  onImage
}: Props) {
  const { toast } = useToast()

  return (
    <div className="w-full">
      <label
        htmlFor="image-upload"
        className="w-full h-[200px] flex flex-col items-center justify-center gap-2 rounded-lg bg-white/10 px-2 cursor-pointer"
      >
        <UploadDropzone
          endpoint="imageUploader"
          onClientUploadComplete={(res: any) => {
            // Do something with the response
            const url = res[0].url;
            onImage(url)
            toast({
              title: "Image uploaded",
              description: "Your image has been uploaded successfully",
            })
          }}
          onUploadError={(error: Error) => {
            // Do something with the error.
            toast({
              title: "Error uploading image",
              description: error.message,
              duration: 10000,
              variant: "destructive",
            })
          }}
        />
      </label>
    </div>
  );
}