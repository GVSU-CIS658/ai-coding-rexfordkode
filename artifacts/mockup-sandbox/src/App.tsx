import { useEffect, useState, type ComponentType } from "react";
import { MoonStar, SunMedium, Sparkles } from "lucide-react";

import { modules as discoveredModules } from "./.generated/mockup-components";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns.at(-1)
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: Readonly<{
  componentPath: string;
  modules: ModuleMap;
}>) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setComponent(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        setError(`No component found at ${componentPath}.tsx`);
        return;
      }

      try {
        const mod = await loader();
        if (cancelled) {
          return;
        }
        const name = componentPath.split("/").at(-1) ?? componentPath;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(
            `No exported React component found in ${componentPath}.tsx\n\nMake sure the file has at least one exported function component.`,
          );
          return;
        }
        setComponent(() => comp);
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load preview.\n${message}`);
      }
    }

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, modules]);

  if (error) {
    return (
      <pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>
        {error}
      </pre>
    );
  }

  if (!Component) return null;

  return <Component />;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

function getPreviewExamplePath(): string {
  const basePath = getBasePath();
  return `${basePath}/preview/DesignSystemShowcase`;
}

function getPreviewPathForExample(example: string): string {
  const basePath = getBasePath();
  return `${basePath}/preview/${example}`;
}

function getInitialTheme(): "light" | "dark" {
  if (globalThis.window === undefined) {
    return "dark";
  }

  const stored = globalThis.window.localStorage.getItem("mockup-theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function Gallery() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-10">
        <div className="mb-8 flex justify-end">
          <ThemeToggle />
        </div>
        <div className="grid gap-6 rounded-4xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8 md:grid-cols-[1.3fr_0.7fr] md:p-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              Component Preview Server
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              A tighter gallery for the design system.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              The preview host now exposes a theme toggle and a real showcase
              entry point, so the empty shell becomes a useful component sandbox
              instead of a placeholder.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={getPreviewExamplePath()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Open showcase
              </a>
              <a
                href={getPreviewPathForExample("ButtonShowcase")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Button demo
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Example preview path:{" "}
              <span className="font-mono text-slate-700">
                {getPreviewExamplePath()}
              </span>
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-slate-50 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Preview kit
                </p>
                <p className="mt-1 text-lg font-semibold">
                  DesignSystemShowcase
                </p>
              </div>
              <div className="rounded-full bg-white/10 p-2 text-white/80">
                <SunMedium className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Button states, cards, and layout primitives.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Theme-aware tokens for light and dark mode.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Preview routes resolve at{" "}
                <span className="font-mono text-white">/preview/*</span>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    globalThis.window.localStorage.setItem("mockup-theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() =>
        setTheme((current) => (current === "dark" ? "light" : "dark"))
      }
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      aria-label="Toggle preview theme"
    >
      {theme === "dark" ? (
        <MoonStar className="h-4 w-4" />
      ) : (
        <SunMedium className="h-4 w-4" />
      )}
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}

function getPreviewPath(): string | null {
  const basePath = getBasePath();
  const { pathname } = globalThis.window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const match = /^\/preview\/(.+)$/u.exec(local);
  return match?.[1] ?? null;
}

function App() {
  const previewPath = getPreviewPath();

  if (previewPath) {
    return (
      <PreviewRenderer
        componentPath={previewPath}
        modules={discoveredModules}
      />
    );
  }

  return <Gallery />;
}

export default App;
