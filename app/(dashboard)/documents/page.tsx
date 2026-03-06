import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import { FolderOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground mt-0.5">
              Upload and manage your financial documents
            </p>
          </div>
        </div>
      </div>

      <DocumentUploader />

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Documents</h2>
        <DocumentList documents={userDocuments as any} />
      </div>
    </div>
  );
}
