import { PlanDiario, TareaPlanificada, BloqueDia, TaskPriority } from './models';

export interface ConfigTiempo {
  // Hora preferida de despertar. Si hay deadlineGlobal, se recalculará para garantizar el tiempo total.
  horaDespertar?: string; // 'HH:MM'
  // Deadline global para que todas las tareas obligatorias estén listas (HH:MM).
  deadlineGlobal?: string;
  // Horas de sueño saludables recomendadas para calcular la hora de dormir.
  horasSuenoSaludable?: number; // por defecto 8h
  bloquesComida: { etiqueta: string; inicio: string; minutos: number }[];
  minutosTransicion: number;
  pausasMinimas: number;
  pausasMaximas: number;
  minutosPausa: number;
}

const aMinutos = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const aHHMM = (minutos: number): string => {
  const total = ((minutos % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const prioridadRank: Record<TaskPriority, number> = {
  Obligatoria: 0,
  Principal: 1,
  Secundaria: 2,
};

const determinarBloqueDia = (hhmm: string): BloqueDia => {
  const minutos = aMinutos(hhmm);
  const h = Math.floor(minutos / 60);
  if (h >= 5 && h < 13) return 'Mañana';
  if (h >= 13 && h < 20) return 'Tarde';
  return 'Noche';
};

export function generarPlanDiario(
  fecha: string,
  tareas: TareaPlanificada[],
  config: ConfigTiempo
): PlanDiario {
  const horasSueno = config.horasSuenoSaludable ?? 8;

  // Ordenamos por prioridad y peso (dificultad/impacto) para programación inteligente.
  const ordenadas = [...tareas].sort((a, b) => {
    const pa = prioridadRank[a.prioridad];
    const pb = prioridadRank[b.prioridad];
    if (pa !== pb) return pa - pb;
    // Si tienen deadline propia, la más temprana primero
    if (a.deadline && b.deadline) {
      const da = aMinutos(a.deadline);
      const db = aMinutos(b.deadline);
      if (da !== db) return da - db;
    }
    if (!!a.deadline !== !!b.deadline) {
      return a.deadline ? -1 : 1;
    }
    // Como desempate, tareas más difíciles/impacto primero
    if (b.impacto !== a.impacto) return b.impacto - a.impacto;
    return b.dificultad - a.dificultad;
  });

  const totalMinTareas = ordenadas.reduce(
    (acc, t) => acc + t.minutosEstimados,
    0
  );
  const transiciones = Math.max(0, ordenadas.length - 1) * config.minutosTransicion;

  // Pausas fisiológicas en función de la carga total
  const minutosBase = totalMinTareas + transiciones;
  const numPausas = Math.max(
    config.pausasMinimas,
    Math.min(config.pausasMaximas, Math.floor(minutosBase / 120))
  );
  const minutosPausaTotal = numPausas * config.minutosPausa;

  const minutosComidas = config.bloquesComida.reduce(
    (acc, b) => acc + b.minutos,
    0
  );

  const minutosRequeridos = minutosBase + minutosPausaTotal + minutosComidas;

  let horaDeadline = config.deadlineGlobal
    ? aMinutos(config.deadlineGlobal)
    : undefined;

  let inicioDia: number;

  if (horaDeadline !== undefined) {
    // El límite de tiempo aplica solo a las tareas principales:
    const principales = ordenadas.filter((t) => t.prioridad === 'Principal');
    const minPrincipales = principales.reduce(
      (acc, t) => acc + t.minutosEstimados,
      0
    );
    const transPrincipales =
      Math.max(0, principales.length - 1) * config.minutosTransicion;
    const basePrincipales = minPrincipales + transPrincipales;
    const numPausasPrincipales = Math.max(
      config.pausasMinimas,
      Math.min(config.pausasMaximas, Math.floor(basePrincipales / 120))
    );
    const minutosPausaPrincipales = numPausasPrincipales * config.minutosPausa;

    const minutosRequeridosPrincipales =
      basePrincipales + minutosPausaPrincipales + minutosComidas;

    inicioDia = horaDeadline - minutosRequeridosPrincipales;
  } else {
    inicioDia = aMinutos(config.horaDespertar ?? '06:30');
  }

  let alertaSobrecarga: string | undefined;
  const sugerencias: string[] = [];

  if (horaDeadline !== undefined && inicioDia < 0) {
    alertaSobrecarga =
      'No hay tiempo suficiente antes del deadline para completar todas las tareas principales, comidas y descansos asociados.';
    sugerencias.push(
      'Reduce la cantidad de tareas, empezando por las Secundarias.',
      'Disminuye la duración estimada de algunas tareas menos críticas.'
    );
    inicioDia = 0;
  }

  const inicioDiaHHMM = aHHMM(inicioDia);

  let cursor = inicioDia;
  const planificadas: TareaPlanificada[] = [];

  for (const t of ordenadas) {
    const ini = cursor;
    const fin = ini + t.minutosEstimados;
    const hhmmIni = aHHMM(ini);
    planificadas.push({
      ...t,
      inicio: `${fecha}T${hhmmIni}`,
      fin: `${fecha}T${aHHMM(fin)}`,
      bloqueDia: determinarBloqueDia(hhmmIni),
    });
    cursor = fin + config.minutosTransicion;
  }

  const tareasComida: TareaPlanificada[] = config.bloquesComida.map((b, idx) => {
    const ini = aMinutos(b.inicio);
    const fin = ini + b.minutos;
    const hhmmIni = aHHMM(ini);
    return {
      id: `comida-${idx}`,
      titulo: b.etiqueta,
      descripcion: 'Bloque de comida',
      obligatoria: true,
      minutosEstimados: b.minutos,
      categoria: 'Físico',
      dificultad: 1,
      impacto: 1,
      prioridad: 'Obligatoria',
      inicio: `${fecha}T${hhmmIni}`,
      fin: `${fecha}T${aHHMM(fin)}`,
      completada: false,
      bloqueDia: determinarBloqueDia(hhmmIni),
    } as TareaPlanificada;
  });

  const plan: PlanDiario = {
    id: fecha,
    fecha,
    tareas: [...planificadas, ...tareasComida].sort((a, b) =>
      a.inicio.localeCompare(b.inicio)
    ),
    minutosTotales: minutosRequeridos,
    horaDespertar: inicioDiaHHMM,
    horaDormir: aHHMM(inicioDia - horasSueno * 60),
    deadlineGlobal: config.deadlineGlobal,
    alertaSobrecarga,
    sugerencias: sugerencias.length ? sugerencias : undefined,
  };

  return plan;
}
