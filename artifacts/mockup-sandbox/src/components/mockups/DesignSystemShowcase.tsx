import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/80 shadow-lg shadow-black/10">
          <CardHeader>
            <CardTitle>Design System Showcase</CardTitle>
            <CardDescription>
              Preview the component library in a realistic composition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <p className="mt-1 text-sm font-medium">Ready for preview</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Theme
                </p>
                <p className="mt-1 text-sm font-medium">Token driven</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Routing
                </p>
                <p className="mt-1 text-sm font-medium">
                  /preview/DesignSystemShowcase
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-lg shadow-black/10">
          <CardHeader>
            <CardTitle>Composition Notes</CardTitle>
            <CardDescription>
              Use this area to test spacing, hierarchy, and surface contrast.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium">Surface</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cards and buttons should sit naturally on both themes.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium">Feedback</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a second preview file next if you want to test forms or
                dialogs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DesignSystemShowcase;
