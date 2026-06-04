import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Consult from "./pages/Consult";
import SessionHistory from "./pages/SessionHistory";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/consult" component={Consult} />
      <Route path="/history" component={SessionHistory} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.20 0.006 285)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "oklch(0.92 0.005 65)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
