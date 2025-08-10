import React, { useState } from "react";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Loader2, X, CheckCircle, AlertCircle } from "lucide-react";
import { useUploadFile } from "react-firebase-hooks/storage";
import { ref } from "firebase/storage";
import { storage } from "@/services/firestore";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  userId: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  userId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const [uploadFile] = useUploadFile();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const storageRef = ref(storage, `images/${userId}/${selectedFile.name}`);
      const result = await uploadFile(storageRef, selectedFile, {
        onProgress: (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
      });

      if (result) {
        const downloadURL = await result.ref.getDownloadURL();
        onUploadSuccess(downloadURL);
        setSelectedFile(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Image</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />

          {selectedFile && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{selectedFile.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center">{Math.round(progress)}%</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!uploading && progress === 100 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Image uploaded successfully.</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUploader;
