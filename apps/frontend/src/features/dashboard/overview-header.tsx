import { format } from "date-fns";
import { Building2, Calendar, Mail } from "lucide-react";

export interface OverviewHeaderProps {
  clientInfo?: {
    name: string;
    email?: string;
    company?: string;
  };
}

export function OverviewHeader({ clientInfo }: OverviewHeaderProps) {
  if (!clientInfo) {
    return null;
  }

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            <Building2 className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {clientInfo.name} Dashboard
            </h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              {clientInfo.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{clientInfo.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Last updated {format(new Date(), "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
