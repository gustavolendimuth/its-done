import Link from "next/link";
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
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-6 text-center mb-16">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Track Time, Boost Productivity
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
              Professional time tracking for contractors and teams. Manage
              projects, track hours, and get paid for your work.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Time Tracking</CardTitle>
              <CardDescription className="text-base">
                Track your work hours with precision and ease
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                Log your time entries, set timers, and track billable hours with
                our intuitive interface.
              </p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Project Management</CardTitle>
              <CardDescription className="text-base">
                Organize and manage your projects efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                Create and manage projects, assign tasks, and track progress
                with our comprehensive project management tools.
              </p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Reports & Analytics</CardTitle>
              <CardDescription className="text-base">
                Get detailed insights into your work patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                Generate detailed reports, analyze productivity trends, and make
                data-driven decisions with our powerful analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
