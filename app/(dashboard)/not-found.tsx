import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Card className="border-slate-200 bg-white shadow-lg">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="p-4 rounded-full bg-slate-100">
              <FileQuestion className="w-12 h-12 text-slate-400" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-slate-900 mb-2">404</h1>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Resource Not Found
              </h2>
              <p className="text-slate-600">
                The document or analysis you're looking for doesn't exist, or you
                don't have permission to access it.
              </p>
            </div>
            <div className="flex gap-3 w-full pt-3">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/analyses" className="flex-1">
                <Button variant="outline" className="w-full">
                  View Analyses
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
