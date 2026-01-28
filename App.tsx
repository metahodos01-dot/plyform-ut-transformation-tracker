
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NeedsAnalysis } from './pages/NeedsAnalysis';
import { ObjectivesKPI } from './pages/ObjectivesKPI';
import { ExecutionPlan } from './pages/ExecutionPlan';
import { Target, BarChart3, CalendarCheck, Home, CheckSquare, Layers } from 'lucide-react';

// Simple Router implementation since we can't use browser URL comfortably in all preview envs
enum Page {
  DASHBOARD = 'dashboard',
  NEEDS = 'needs',
  OBJECTIVES = 'objectives',
  EXECUTION = 'execution'
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);

  const renderPage = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard onChangePage={setCurrentPage} />;
      case Page.NEEDS:
        return <NeedsAnalysis />;
      case Page.OBJECTIVES:
        return <ObjectivesKPI />;
      case Page.EXECUTION:
        return <ExecutionPlan />;
      default:
        return <Dashboard onChangePage={setCurrentPage} />;
    }
  };

  const navItems = [
    { id: Page.DASHBOARD, label: 'Panoramica', icon: Home },
    { id: Page.NEEDS, label: 'Esigenze (As-Is)', icon: Target },
    { id: Page.OBJECTIVES, label: 'User Stories (Agile)', icon: Layers },
    { id: Page.EXECUTION, label: 'Sprint', icon: CalendarCheck },
  ];

  return (
    <Layout
      activePage={currentPage}
      onNavigate={(p) => setCurrentPage(p as Page)}
      navItems={navItems}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
