"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { analysisCriteria } from "@/config/criteria.config";
import { CheckCircle2, Circle, Play } from "lucide-react";

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
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg text-slate-900">Select Analysis Criteria</CardTitle>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Choose which aspects of the financial document to analyze
        </p>
      </CardHeader>
      <CardContent className="space-y-5 sm:space-y-6 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {Object.values(analysisCriteria).map((criterion) => {
            const isSelected = selectedCriteria.includes(criterion.id);
            
            return (
              <button
                key={criterion.id}
                onClick={() => toggleCriterion(criterion.id)}
                className={`group p-3 sm:p-4 rounded-xl text-left transition-all ${
                  isSelected
                    ? "border-2 border-blue-200 bg-blue-50 shadow-sm"
                    : "border-2 border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    ) : (
                      <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 ${
                      isSelected ? "text-blue-900" : "text-slate-900"
                    }`}>
                      {criterion.name}
                    </h3>
                    <p className={`text-xs sm:text-sm ${
                      isSelected ? "text-blue-700" : "text-slate-600"
                    }`}>
                      {criterion.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-200">
          <Button
            onClick={handleAnalyze}
            disabled={selectedCriteria.length === 0 || isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 h-10 sm:h-12 text-sm sm:text-base font-medium"
            size="lg"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {isAnalyzing ? "Analyzing..." : `Run Analysis (${selectedCriteria.length} criteria)`}
          </Button>
          {selectedCriteria.length === 0 && (
            <p className="text-xs text-slate-500 text-center mt-2">
              Select at least one criterion to continue
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
