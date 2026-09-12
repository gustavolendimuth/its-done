"use client";

// Minimal placeholder — fleshed out in T20 (client/project/description fields,
// validation, submit via useFinishWorkSession, and the discard flow). It
// exists already so WorkTimerWidget (T18) can render it inline once the
// session reaches STOPPING, per design.md's WorkTimerWidget interface.
import { Card, CardContent } from "@/components/ui/card";
import { LocalWorkSession } from "@/lib/work-timer-db";

export interface WorkSessionFinishFormProps {
  session: LocalWorkSession;
  onSuccess: () => void;
}

export function WorkSessionFinishForm({ session }: WorkSessionFinishFormProps) {
  return (
    <Card
      data-testid="work-session-finish-form"
      className="fixed bottom-4 right-4 z-50 w-80 border-green-200 dark:border-green-800"
    >
      <CardContent className="p-4 text-sm text-muted-foreground">
        Sessão {session.id} encerrada — formulário em construção.
      </CardContent>
    </Card>
  );
}
