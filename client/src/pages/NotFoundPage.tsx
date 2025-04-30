import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-light">
      <div className="w-full max-w-md mx-4 bg-white p-8 rounded-xl shadow-md">
        <div className="flex mb-4 gap-2">
          <AlertCircle className="h-8 w-8 text-accent" />
          <h1 className="text-2xl font-bold text-dark">404 Page Not Found</h1>
        </div>

        <p className="mt-4 mb-6 text-gray-600">
          Sorry, we couldn't find the page you're looking for. Would you like to return to your cultural journey?
        </p>
        
        <div className="flex gap-4">
          <Button asChild variant="default">
            <Link href="/">
              Return Home
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href="/puzzles">
              Browse Puzzles
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
