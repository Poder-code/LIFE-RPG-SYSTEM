import React, { useEffect, useMemo, useState } from 'react';
import {
  PlanDiario,
  TareaPlanificada,
  TaskCategory,
  TaskDefinition,
  TaskPriority,
} from './models';
import { generarPlanDiario, ConfigTiempo } from './timeEngine';
import { getCurrentUser, getUserTasks, saveUserTasks } from './services.db';

const hoy = () => new Date().toISOString().slice(0, 10);

const tareasBase: TaskDefinition[] = [
  {
    id: 'manana-ejercicio',
    titulo: 'Ejercicio matutino',
    obligatoria: false,
    minutosEstimados: 40,
    categoria: 'Físico',
    dificultad: 3,
    impacto: 4,
    prioridad: 'Principal',
    esPermanente: false,
  },
  {
    id: 'bloque-profesional',
    titulo: 'Bloque de trabajo profundo',
    obligatoria: true,
    minutosEstimados: 90,
    categoria: 'Profesional',
    dificultad: 4,
    impacto: 5,
    prioridad: 'Obligatoria',
    esPermanente: true,
  },
  {
    id: 'lectura',
    titulo: 'Lectura / estudio',
    obligatoria: false,
    minutosEstimados: 30,
    categoria: 'Mental',
    dificultad: 2,
    impacto: 3,
    prioridad: 'Secundaria',
    esPermanente: false,
  },
];

export interface DailyPlannerProps {
  onPlan: (plan: PlanDiario, tareasSeleccionadas: TareaPlanificada[]) => void;
}

export const DailyPlanner: React.FC<DailyPlannerProps> = ({ onPlan }) => {
  const [fecha, setFecha] = useState(hoy());
  const [horaDespertar, setHoraDespertar] = useState('06:30');
  const [horaDeadline, setHoraDeadline] = useState('');

  const [tareas, setTareas] = useState<TaskDefinition[]>(tareasBase);
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);

  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevosMin, setNuevosMin] = useState(30);
  const [nuevaCategoria, setNuevaCategoria] = useState<TaskCategory>('Profesional');
  const [nuevaDif, setNuevaDif] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [nuevoImp, setNuevoImp] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [nuevaPrioridad, setNuevaPrioridad] = useState<TaskPriority>('Principal');
  const [nuevaPermanente, setNuevaPermanente] = useState(false);

  const [minDesayuno, setMinDesayuno] = useState(30);
  const [minAlmuerzo, setMinAlmuerzo] = useState(45);
  const [minCena, setMinCena] = useState(45);

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editMin, setEditMin] = useState(30);
  const [editCategoria, setEditCategoria] = useState<TaskCategory>('Profesional');
  const [editDif, setEditDif] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [editImp, setEditImp] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [editPrioridad, setEditPrioridad] = useState<TaskPriority>('Principal');
  const [editDeadline, setEditDeadline] = useState('');
  const [editPermanente, setEditPermanente] = useState(false);

  // Cargar librería de tareas desde BD local al iniciar
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    const stored = getUserTasks(user.id);
    if (stored.length) {
      setTareas(stored);
    } else {
      // Inicializamos con las tareas base la primera vez
      saveUserTasks(user.id, tareasBase);
    }
  }, []);

  // Guardar librería de tareas en BD local cuando cambie
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    saveUserTasks(user.id, tareas);
  }, [tareas]);

  const toggleSeleccion = (id: string) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const tareasObligatorias = useMemo(
    () => tareas.filter((t) => t.prioridad === 'Obligatoria'),
    [tareas]
  );

  const tareasPrincipales = useMemo(
    () => tareas.filter((t) => t.prioridad === 'Principal'),
    [tareas]
  );

  const tareasSecundarias = useMemo(
    () => tareas.filter((t) => t.prioridad === 'Secundaria'),
    [tareas]
  );

  const tareasSeleccionadas: TareaPlanificada[] = useMemo(
    () => {
      const idsPermanentes = tareas
        .filter((t) => t.prioridad === 'Obligatoria' && t.esPermanente)
        .map((t) => t.id);
      const finalIds = new Set([...seleccionadas, ...idsPermanentes]);

      return tareas
        .filter((t) => finalIds.has(t.id))
        .map<TareaPlanificada>((t) => ({
          ...t,
          inicio: '',
          fin: '',
          completada: false,
          // Se reasignará en el motor, pero necesitamos un valor inicial válido
          bloqueDia: 'Mañana',
        }));
    },
    [tareas, seleccionadas]
  );

  const agregarTarea = () => {
    if (!nuevoTitulo.trim()) return;
    const id = `t-${Date.now()}`;
    const nueva: TaskDefinition = {
      id,
      titulo: nuevoTitulo.trim(),
      obligatoria: nuevaPrioridad === 'Obligatoria',
      minutosEstimados: nuevosMin,
      categoria: nuevaCategoria,
      dificultad: nuevaDif,
      impacto: nuevoImp,
      prioridad: nuevaPrioridad,
      esPermanente: nuevaPermanente && nuevaPrioridad === 'Obligatoria',
    };
    setTareas((prev) => [...prev, nueva]);
    setNuevoTitulo('');
    setNuevaPermanente(false);
  };

  const abrirEdicion = (id: string) => {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;
    setEditId(id);
    setEditTitulo(tarea.titulo);
    setEditMin(tarea.minutosEstimados);
    setEditCategoria(tarea.categoria);
    setEditDif(tarea.dificultad);
    setEditImp(tarea.impacto);
    setEditPrioridad(tarea.prioridad);
    setEditDeadline(tarea.deadline ?? '');
    setEditPermanente(!!tarea.esPermanente);
  };

  const cancelarEdicion = () => {
    setEditId(null);
  };

  const guardarEdicion = () => {
    if (!editId || !editTitulo.trim()) return;
    setTareas((prev) =>
      prev.map((t) =>
        t.id === editId
          ? {
              ...t,
              titulo: editTitulo.trim(),
              minutosEstimados: editMin,
              categoria: editCategoria,
              dificultad: editDif,
              impacto: editImp,
              prioridad: editPrioridad,
              deadline: editDeadline || undefined,
              obligatoria: editPrioridad === 'Obligatoria',
              esPermanente: editPermanente && editPrioridad === 'Obligatoria',
            }
          : t
      )
    );
    setEditId(null);

    // Si había tareas seleccionadas, regenerar plan para aplicar cambios
    if (tareasSeleccionadas.length) {
      generar();
    }
  };

  const eliminarTarea = (id: string) => {
    if (!window.confirm('¿Seguro que quieres borrar esta tarea?')) return;
    setTareas((prev) => prev.filter((t) => t.id !== id));
    setSeleccionadas((prev) => prev.filter((x) => x !== id));
    if (tareasSeleccionadas.length) {
      generar();
    }
  };

  const generar = () => {
    if (!tareasSeleccionadas.length) return;

    const config: ConfigTiempo = {
      horaDespertar,
      deadlineGlobal: horaDeadline || undefined,
      horasSuenoSaludable: 8,
      minutosTransicion: 3,
      pausasMinimas: 2,
      pausasMaximas: 3,
      minutosPausa: 6,
      bloquesComida: [
        { etiqueta: 'Desayuno', inicio: '07:30', minutos: minDesayuno },
        { etiqueta: 'Almuerzo', inicio: '13:00', minutos: minAlmuerzo },
        { etiqueta: 'Cena', inicio: '19:30', minutos: minCena },
      ],
    };

    const plan = generarPlanDiario(fecha, tareasSeleccionadas, config);
    // Enviamos todas las tareas, incluyendo bloques de comida, para que aparezcan en la checklist
    onPlan(plan, plan.tareas);
  };

  return (
    <div className="panel panel-planner">
      <div className="panel-header">
        <h2>Plan diario</h2>
        <p>Define tu misión del día y genera un horario optimizado.</p>
      </div>

      <div className="planner-controls">
        <div className="field-group">
          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Hora de despertar</label>
          <input
            type="time"
            value={horaDespertar}
            onChange={(e) => setHoraDespertar(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Deadline global tareas principales (opcional)</label>
          <input
            type="time"
            value={horaDeadline}
            onChange={(e) => setHoraDeadline(e.target.value)}
          />
        </div>
        <div className="field-group small-group-row">
          <label>Duración comidas (min)</label>
          <div className="small-inputs-row">
            <span>Desayuno</span>
            <input
              type="number"
              min={10}
              max={180}
              value={minDesayuno}
              onChange={(e) => setMinDesayuno(Number(e.target.value))}
            />
            <span>Almuerzo</span>
            <input
              type="number"
              min={10}
              max={240}
              value={minAlmuerzo}
              onChange={(e) => setMinAlmuerzo(Number(e.target.value))}
            />
            <span>Cena</span>
            <input
              type="number"
              min={10}
              max={240}
              value={minCena}
              onChange={(e) => setMinCena(Number(e.target.value))}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={generar}>
          Generar horario optimizado
        </button>
      </div>

      <div className="planner-grid">
        <div className="task-column">
          <h3>Tareas obligatorias</h3>
          <ul className="task-list">
            {tareasObligatorias.map((t) => (
              <li key={t.id} className="task-item">
                <label>
                  <input
                    type="checkbox"
                    checked={seleccionadas.includes(t.id)}
                    onChange={() => toggleSeleccion(t.id)}
                  />
                  <span className="task-title">{t.titulo}</span>
                  <span className="task-meta">
                    {t.minutosEstimados} min · {t.categoria} · D{t.dificultad}
                  </span>
                </label>
                <div className="task-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => abrirEdicion(t.id)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-danger"
                    onClick={() => eliminarTarea(t.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="task-column">
          <h3>Tareas principales</h3>
          <ul className="task-list">
            {tareasPrincipales.map((t) => (
              <li key={t.id} className="task-item">
                <label>
                  <input
                    type="checkbox"
                    checked={seleccionadas.includes(t.id)}
                    onChange={() => toggleSeleccion(t.id)}
                  />
                  <span className="task-title">{t.titulo}</span>
                  <span className="task-meta">
                    {t.minutosEstimados} min · {t.categoria} · D{t.dificultad}
                  </span>
                </label>
                <div className="task-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => abrirEdicion(t.id)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-danger"
                    onClick={() => eliminarTarea(t.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="task-column">
          <h3>Tareas secundarias</h3>
          <ul className="task-list">
            {tareasSecundarias.map((t) => (
              <li key={t.id} className="task-item">
                <label>
                  <input
                    type="checkbox"
                    checked={seleccionadas.includes(t.id)}
                    onChange={() => toggleSeleccion(t.id)}
                  />
                  <span className="task-title">{t.titulo}</span>
                  <span className="task-meta">
                    {t.minutosEstimados} min · {t.categoria} · D{t.dificultad}
                  </span>
                </label>
                <div className="task-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => abrirEdicion(t.id)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-danger"
                    onClick={() => eliminarTarea(t.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="task-column">
          <h3>Nueva tarea</h3>
          <div className="new-task-form">
            <label>
              Título
              <input
                type="text"
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                placeholder="Ej: Estudiar 30 minutos"
              />
            </label>
            <label>
              Minutos estimados
              <input
                type="number"
                min={5}
                step={5}
                value={nuevosMin}
                onChange={(e) => setNuevosMin(Number(e.target.value))}
              />
            </label>
            <label>
              Categoría
              <select
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value as TaskCategory)}
              >
                <option value="Físico">Físico</option>
                <option value="Mental">Mental</option>
                <option value="Profesional">Profesional</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Orden">Orden</option>
                <option value="Relaciones">Relaciones</option>
                <option value="Disciplina">Disciplina</option>
              </select>
            </label>
            <label>
              Dificultad (1–5)
              <input
                type="number"
                min={1}
                max={5}
                value={nuevaDif}
                onChange={(e) =>
                  setNuevaDif(
                    Math.min(5, Math.max(1, Number(e.target.value))) as
                      | 1
                      | 2
                      | 3
                      | 4
                      | 5
                  )
                }
              />
            </label>
            <label>
              Impacto (1–5)
              <input
                type="number"
                min={1}
                max={5}
                value={nuevoImp}
                onChange={(e) =>
                  setNuevoImp(
                    Math.min(5, Math.max(1, Number(e.target.value))) as
                      | 1
                      | 2
                      | 3
                      | 4
                      | 5
                  )
                }
              />
            </label>
            <label>
              Prioridad
              <select
                value={nuevaPrioridad}
                onChange={(e) => setNuevaPrioridad(e.target.value as TaskPriority)}
              >
                <option value="Obligatoria">Obligatoria</option>
                <option value="Principal">Principal</option>
                <option value="Secundaria">Secundaria</option>
              </select>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={nuevaPermanente}
                disabled={nuevaPrioridad !== 'Obligatoria'}
                onChange={(e) => setNuevaPermanente(e.target.checked)}
              />
              Obligatoria permanente
            </label>
            <button className="btn-secondary" onClick={agregarTarea}>
              Agregar a la librería
            </button>
          </div>
        </div>
        {editId && (
          <div className="task-column">
            <h3>Editar tarea</h3>
            <div className="new-task-form">
              <label>
                Título
                <input
                  type="text"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                />
              </label>
              <label>
                Minutos estimados
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={editMin}
                  onChange={(e) => setEditMin(Number(e.target.value))}
                />
              </label>
              <label>
                Categoría
                <select
                  value={editCategoria}
                  onChange={(e) =>
                    setEditCategoria(e.target.value as TaskCategory)
                  }
                >
                  <option value="Físico">Físico</option>
                  <option value="Mental">Mental</option>
                  <option value="Profesional">Profesional</option>
                  <option value="Finanzas">Finanzas</option>
                  <option value="Orden">Orden</option>
                  <option value="Relaciones">Relaciones</option>
                  <option value="Disciplina">Disciplina</option>
                </select>
              </label>
              <label>
                Dificultad (1–5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={editDif}
                  onChange={(e) =>
                    setEditDif(
                      Math.min(5, Math.max(1, Number(e.target.value))) as
                        | 1
                        | 2
                        | 3
                        | 4
                        | 5
                    )
                  }
                />
              </label>
              <label>
                Impacto (1–5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={editImp}
                  onChange={(e) =>
                    setEditImp(
                      Math.min(5, Math.max(1, Number(e.target.value))) as
                        | 1
                        | 2
                        | 3
                        | 4
                        | 5
                    )
                  }
                />
              </label>
              <label>
                Prioridad
                <select
                  value={editPrioridad}
                  onChange={(e) =>
                    setEditPrioridad(e.target.value as TaskPriority)
                  }
                >
                  <option value="Obligatoria">Obligatoria</option>
                  <option value="Principal">Principal</option>
                  <option value="Secundaria">Secundaria</option>
                </select>
              </label>
              <label>
                Deadline (opcional)
                <input
                  type="time"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                />
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={editPermanente}
                  disabled={editPrioridad !== 'Obligatoria'}
                  onChange={(e) => setEditPermanente(e.target.checked)}
                />
                Obligatoria permanente
              </label>
              <div className="edit-actions">
                <button className="btn-primary" onClick={guardarEdicion}>
                  Guardar cambios
                </button>
                <button className="btn-secondary" onClick={cancelarEdicion}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPlanner;
