import React, { useMemo } from 'react';
import { PlanDiario, TareaPlanificada, BloqueDia } from './models';
import QuickPlanner from './QuickPlanner';
import DailyChecklist from './DailyChecklist';

export interface DashboardProps {
  plan?: PlanDiario;
  tareas: TareaPlanificada[];
}

const Dashboard: React.FC<DashboardProps> = ({ plan, tareas }) => {
  const porcentaje = tareas.length
    ? Math.round(
        (tareas.filter((t) => t.completada).length / tareas.length) * 100
      )
    : 0;

  const bloques: BloqueDia[] = ['Mañana', 'Tarde', 'Noche'];

  const resumenBloques = useMemo(() => {
    if (!plan) return {} as Record<BloqueDia, {
      minutos: number;
      completadas: number;
      total: number;
    }>;

    const base: Record<BloqueDia, { minutos: number; completadas: number; total: number }> = {
      Mañana: { minutos: 0, completadas: 0, total: 0 },
      Tarde: { minutos: 0, completadas: 0, total: 0 },
      Noche: { minutos: 0, completadas: 0, total: 0 },
    };

    for (const t of plan.tareas) {
      const dur = t.minutosEstimados;
      base[t.bloqueDia].minutos += dur;
      base[t.bloqueDia].total += 1;
      if (t.completada) base[t.bloqueDia].completadas += 1;
    }

    return base;
  }, [plan]);

  const porcentajeBloque = (bloque: BloqueDia) => {
    if (!plan) return 0;
    const info = resumenBloques[bloque];
    if (!info || !info.total) return 0;
    return Math.round((info.completadas / info.total) * 100);
  };

  return (
    <div className="dashboard-container">
      {/* Quick Planner Section */}
      <QuickPlanner />
      
      {/* Daily Checklist Section */}
      <DailyChecklist />
      
      {/* Existing Dashboard Panel */}
      <div className="panel panel-dashboard">
        <div className="panel-header">
          <h2>Panel de control</h2>
          <p>Vista general de tu día como una misión RPG.</p>
        </div>

        {plan ? (
          <>
            <p className="hint">
              Fecha: <strong>{plan.fecha}</strong> · Cumplimiento:{' '}
              <strong>{porcentaje}%</strong>
            </p>
            <p className="hint">
              Despertar calculado: <strong>{plan.horaDespertar}</strong> · Sueño recomendado:{' '}
              <strong>{plan.horaDormir}</strong>
              {plan.deadlineGlobal && (
                <>
                  {' '}
                  · Deadline obligatorio:{' '}
                  <strong>{plan.deadlineGlobal}</strong>
                </>
              )}
            </p>

            {plan.alertaSobrecarga && (
              <div className="alert-warning">
                <strong>Alerta de sobrecarga:</strong> {plan.alertaSobrecarga}
                {plan.sugerencias && plan.sugerencias.length > 0 && (
                  <ul className="alert-suggestions">
                    {plan.sugerencias.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="day-blocks">
              {bloques.map((b) => {
                const info = plan ? resumenBloques[b] : undefined;
                const min = info?.minutos ?? 0;
                const pct = porcentajeBloque(b);
                const horas = Math.floor(min / 60);
                const minsRest = min % 60;
                return (
                  <div key={b} className="day-block">
                    <div className="day-block-header">
                      <h3>{b}</h3>
                      <span className="day-block-time">
                        {horas}h {minsRest}m
                      </span>
                    </div>
                    <div className="day-block-progress">
                      <div
                        className="day-block-progress-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="day-block-meta">
                      Progreso en este bloque: <strong>{pct}%</strong>
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="timeline">
              <h3>Línea de tiempo optimizada</h3>
              <p>
                Duración total planificada:{' '}
                <strong>
                  {Math.round(plan.minutosTotales / 60)}h {plan.minutosTotales % 60}m
                </strong>
              </p>
              <ul className="timeline-list">
                {plan.tareas.map((t) => (
                  <li
                    key={t.id}
                    className={t.id.startsWith('comida-') ? 'timeline-meal' : ''}
                  >
                    <div className="timeline-time">
                      {t.inicio.slice(11, 16)} → {t.fin.slice(11, 16)}
                    </div>
                    <div className="timeline-main">
                      <div className="timeline-title">{t.titulo}</div>
                      <div className="timeline-meta">
                        {t.categoria} · D{t.dificultad} · {t.minutosEstimados} min ·{' '}
                        {t.prioridad}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="hint">
            Genera un plan diario para ver la línea de tiempo y el resumen.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
