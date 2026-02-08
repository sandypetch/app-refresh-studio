import { useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadSectionProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export const UploadSection = ({ onUpload, isUploading }: UploadSectionProps) => {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
        e.target.value = "";
      }
    },
    [onUpload]
  );

  return (
    <Card className="p-8 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Upload Audio or Video</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Supports MP3, WAV, M4A, MP4, MOV, and more
          </p>
        </div>
        <label htmlFor="file-upload">
          <Button disabled={isUploading} asChild>
            <span className="cursor-pointer">
              {isUploading ? "Processing..." : "Choose File"}
            </span>
          </Button>
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </Card>
  );
};