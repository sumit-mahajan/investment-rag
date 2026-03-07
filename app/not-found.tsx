import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200 bg-white shadow-lg">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="p-4 rounded-full bg-slate-100">
              <FileQuestion className="w-12 h-12 text-slate-400" />
            </div>
            <div>
              <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Page Not Found
              </h2>
              <p className="text-slate-600">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            <div className="flex gap-3 w-full pt-3">
              <Link href="/" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Go Home
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
