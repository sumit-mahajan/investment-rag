"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analysisCriteria } from "@/config/criteria.config";

interface CriteriaSelectorProps {
  onAnalyze: (criteriaIds: string[]) => void;
  isAnalyzing: boolean;
}

export function CriteriaSelector({ onAnalyze, isAnalyzing }: CriteriaSelectorProps) {
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([
    "financial-health",
    "risk-assessment",
    "growth-potential",
  ]);

  const toggleCriterion = (id: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleAnalyze = () => {
    if (selectedCriteria.length > 0) {
      onAnalyze(selectedCriteria);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Analysis Criteria</CardTitle>
        <CardDescription>Choose which aspects of the financial document to analyze</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(analysisCriteria).map((criterion) => (
            <button
              key={criterion.id}
              onClick={() => toggleCriterion(criterion.id)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedCriteria.includes(criterion.id)
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{criterion.name}</h3>
                {selectedCriteria.includes(criterion.id) && (
                  <Badge variant="default">Selected</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{criterion.description}</p>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleAnalyze}
            disabled={selectedCriteria.length === 0 || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? "Analyzing..." : `Analyze (${selectedCriteria.length} criteria)`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
