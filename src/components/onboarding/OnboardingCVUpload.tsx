import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

interface OnboardingCVUploadProps {
  onUpload: (file: File) => void;
  onSkip: () => void;
  uploading: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const OnboardingCVUpload = ({ onUpload, onSkip, uploading }: OnboardingCVUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a PDF or Word document";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Upload Your CV</h2>
        <p className="text-muted-foreground max-w-md">
          We'll analyze your experience and skills to find the best matching jobs for you
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <div className="flex flex-col items-center space-y-4">
            {selectedFile ? (
              <>
                <FileText className="w-16 h-16 text-primary" />
                <div>
                  <p className="font-semibold">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    PDF or Word document (max 5MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            size="lg"
            className="w-full"
          >
            {uploading ? "Uploading..." : "Continue"}
          </Button>
          
          <Button
            onClick={onSkip}
            variant="ghost"
            size="lg"
            className="w-full"
            disabled={uploading}
          >
            Skip for now
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-md">
        Your CV is securely stored and only used to match you with relevant jobs
      </p>
    </div>
  );
};
