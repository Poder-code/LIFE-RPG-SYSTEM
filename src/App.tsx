import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './styles.css';
import { PlanDiario, TareaPlanificada } from './models';
import Dashboard from './Dashboard';
import Navigation from './Navigation';
import { getCurrentUser, getLastPlan } from './services.db';

const App: React.FC = () => {
  const [plan, setPlan] = useState<PlanDiario | undefined>();
  const [tareasDia, setTareasDia] = useState<TareaPlanificada[]>([]);

  const porcentajeHoy = useMemo(() => {
    if (!tareasDia.length) return 0;
    const hechas = tareasDia.filter((t) => t.completada).length;
    return Math.round((hechas / tareasDia.length) * 100);
  }, [tareasDia]);

  // Recuperar último plan/checklist del usuario al cargar la app
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    const snapshot = getLastPlan(user.id);
    if (snapshot) {
      setPlan(snapshot.plan);
      setTareasDia(snapshot.tareasDia);
    }
  }, []);

  return (
    <div className="app-root">
      <Navigation />
      
      <header className="app-header">
        <div className="app-title-block">
          <h1>Life RPG System</h1>
          <p className="app-subtitle">
            Misiones diarias, XP y disciplina para tu vida como un RPG.
          </p>
        </div>
        <div className="app-header-right">
          <div className="header-level">Prototipo</div>
          <div className="header-xp">Cumplimiento hoy: {porcentajeHoy}%</div>
        </div>
      </header>

      <main className="app-main">
        <section className="layout-single">
          <Dashboard plan={plan} tareas={tareasDia} />
        </section>
      </main>
    </div>
  );
};

export default App;
