import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Lazy-loaded pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const PuzzlePage = lazy(() => import("@/pages/PuzzlePage"));
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage"));
const CulturesPage = lazy(() => import("@/pages/CulturesPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Furniture Delivery App Pages
const DeliveryDashboardPage = lazy(() => import("@/pages/DeliveryDashboardPage"));
const DeliveryTrackingPage = lazy(() => import("@/pages/DeliveryTrackingPage"));

function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">Loading...</div>}>
            <Switch>
              {/* Use the original home page */}
              <Route path="/" component={HomePage} />
              
              {/* Furniture Delivery Routes */}
              <Route path="/delivery/dashboard" component={DeliveryDashboardPage} />
              <Route path="/tracking/:id">
                {({ params }) => <DeliveryTrackingPage id={parseInt(params.id)} />}
              </Route>
              
              {/* Original Application Routes */}
              <Route path="/puzzles" component={PuzzlePage} />
              <Route path="/puzzles/:id">
                {({ params }) => <PuzzlePage id={parseInt(params.id)} />}
              </Route>
              <Route path="/achievements" component={AchievementsPage} />
              <Route path="/cultures" component={CulturesPage} />
              <Route component={NotFoundPage} />
            </Switch>
          </Suspense>
        </main>
        <Footer />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
