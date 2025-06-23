import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, ClipboardList, BarChart3 } from "lucide-react";

export default function Home() {
  const t = useTranslations("home");

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-6 text-center mb-16">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/register">{t("getStarted")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">
                {t("features.timeTracking.title")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("features.timeTracking.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                {t("features.timeTracking.description")}
              </p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">
                {t("features.projectManagement.title")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("features.projectManagement.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                {t("features.projectManagement.description")}
              </p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">
                {t("features.analytics.title")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("features.analytics.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                {t("features.analytics.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
