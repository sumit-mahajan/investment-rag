import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { FileText } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">Investment RAG</span>
            </Link>

            <nav className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm font-medium hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/documents" className="text-sm font-medium hover:text-blue-600">
                Documents
              </Link>
              <UserButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
