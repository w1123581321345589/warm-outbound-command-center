import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Pipeline from "@/pages/Pipeline";
import Tasks from "@/pages/Tasks";
import QCQueue from "@/pages/QCQueue";
import Templates from "@/pages/Templates";
import Analytics from "@/pages/Analytics";
import Import from "@/pages/Import";
import NotFound from "@/pages/not-found";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;
  
  return user ? <Component {...rest} /> : null;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {user ? <Dashboard /> : <Landing />}
      </Route>
      <Route path="/pipeline">
        {() => <PrivateRoute component={Pipeline} />}
      </Route>
      <Route path="/tasks">
        {() => <PrivateRoute component={Tasks} />}
      </Route>
      <Route path="/qc">
        {() => <PrivateRoute component={QCQueue} />}
      </Route>
      <Route path="/templates">
        {() => <PrivateRoute component={Templates} />}
      </Route>
      <Route path="/analytics">
        {() => <PrivateRoute component={Analytics} />}
      </Route>
      <Route path="/import">
        {() => <PrivateRoute component={Import} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
