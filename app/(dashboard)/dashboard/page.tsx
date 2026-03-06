import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { documents, analyses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, TrendingUp, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user's documents
  const userDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt))
    .limit(5);

  // Get user's analyses with document info
  const userAnalyses = await db
    .select({
      id: analyses.id,
      verdict: analyses.verdict,
      status: analyses.status,
      createdAt: analyses.createdAt,
      documentName: documents.originalName,
      companyName: documents.companyName,
    })
    .from(analyses)
    .innerJoin(documents, eq(analyses.documentId, documents.id))
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt))
    .limit(5);

  const totalAnalyses = await db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your financial document analysis workspace
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userDocuments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalyses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userDocuments.filter((d) => d.status === "processing").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start analyzing financial documents</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/documents">
            <Button>Upload Document</Button>
          </Link>
          <Link href="/documents">
            <Button variant="outline">View All Documents</Button>
          </Link>
          <Link href="/analyses">
            <Button variant="outline">View All Analyses</Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Your latest uploaded documents</CardDescription>
            </div>
            <Link href="/documents">
              <Button variant="ghost" size="sm">
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {userDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents yet. Upload your first 10-K filing to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {userDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/analysis/${doc.id}`}
                    className="block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{doc.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.companyName || "Unknown Company"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium capitalize">{doc.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>Your latest analysis results</CardDescription>
            </div>
            <Link href="/analyses">
              <Button variant="ghost" size="sm">
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {userAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No analyses yet. Run an analysis on a document to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {userAnalyses.map((a) => (
                  <Link
                    key={a.id}
                    href={`/analyses/${a.id}`}
                    className="block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{a.documentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {a.companyName || "Document"}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {a.verdict && (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              a.verdict === "POSITIVE"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : a.verdict === "NEGATIVE"
                                  ? "bg-rose-500/15 text-rose-700"
                                  : a.verdict === "MIXED"
                                    ? "bg-amber-500/15 text-amber-700"
                                    : "bg-slate-500/15 text-slate-700"
                            }`}
                          >
                            {a.verdict}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
