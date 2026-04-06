import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { UIProvider } from "./contexts/ui-context";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/layout/AppLayout";

import Home from "./pages/Home";
import Videos from "./pages/Videos";
import Folders from "./pages/Folders";
import VideoDetail from "./pages/VideoDetail";
import AiOutputView from "./pages/AiOutputView";
import AIAssistant from "./pages/AIAssistant";
import Login from "./pages/Login";
import Templates from "./pages/Templates";
import KnowledgeGraph from "./pages/KnowledgeGraph";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <AppLayout><Home /></AppLayout>
      </Route>
      <Route path="/videos">
        <AppLayout><Videos /></AppLayout>
      </Route>
      <Route path="/folders">
        <AppLayout><Folders /></AppLayout>
      </Route>
      <Route path="/videos/:id">
        <AppLayout><VideoDetail /></AppLayout>
      </Route>
      <Route path="/videos/:id/output/:type">
        <AppLayout><AiOutputView /></AppLayout>
      </Route>
      <Route path="/ai">
        <AppLayout><AIAssistant /></AppLayout>
      </Route>
      <Route path="/templates">
        <AppLayout><Templates /></AppLayout>
      </Route>
      <Route path="/knowledge-graph">
        <AppLayout><KnowledgeGraph /></AppLayout>
      </Route>
      <Route>
        <AppLayout><NotFound /></AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <UIProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </UIProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
