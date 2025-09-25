import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { GlassmorphicInput } from "../ui/GlassmorphicInput";
import { Label } from "../ui/Label";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Button } from "@/components/ui/Button";
import { Lock, Eye, EyeOff } from "lucide-react";

interface SecureLoginPageProps {
  onLoginSuccess?: () => void;
  onError?: (error: Error) => void;
}

const SecureLoginPage = ({ onLoginSuccess, onError }: SecureLoginPageProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Dummy logic for now, replace with actual auth logic
      if (password === "password") {
        console.log("Logged in");
        onLoginSuccess?.();
      } else {
        throw new Error("Invalid password");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Secure Login</CardTitle>
          <CardDescription>
            Enter your password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="password">Password</Label>
                <GlassmorphicInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  label="Password"
                  icon={<Lock className="h-5 w-5" />}
                  variant="glass"
                  size="lg"
                  animatedLabel
                  realTimeValidation
                  showPasswordToggle
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureLoginPage;
