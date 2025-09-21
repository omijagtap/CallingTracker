
"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="p-6 bg-card border rounded-lg shadow-sm">
        <div className="flex items-start justify-between relative">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-border -z-10"></div>
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          ></div>

          {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;

            return (
              <div
                key={step.number}
                className="flex flex-col items-center text-center w-40"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-card",
                    {
                      "border-primary": isActive || isCompleted,
                      "border-border": !isActive && !isCompleted,
                      "bg-primary text-primary-foreground": isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span
                      className={cn("font-semibold", {
                        "text-primary": isActive,
                        "text-muted-foreground": !isActive,
                      })}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
                <h3
                  className={cn("mt-3 text-sm font-semibold", {
                    "text-foreground": isActive || isCompleted,
                    "text-muted-foreground": !isActive && !isCompleted,
                  })}
                >
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
