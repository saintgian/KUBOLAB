/**
 * maintenance.ts (Equipos)
 * Motor de reglas de mantenimiento (spec §8-§11, §13). Para cada `MaintenanceRule` habilitada que
 * aplica al perfil de la impresora, calcula un `MaintenanceAlert` con estado + motivo textual +
 * fuente — nunca solo un color (spec §13 "No depender solo del color").
 *
 * Reglas de estado (spec §8/§13):
 * - triggers numéricos (hours/printCount/filamentGrams/abrasiveGrams/calendarDays) con acción
 *   inspect/clean/lubricate llegan como máximo a `review` — jamás a `attention` por sí solos; una
 *   alerta por uso no implica reemplazo.
 * - `attention` solo aparece por: incompatibilidad de configuración (nozzle abrasivo con boquilla
 *   inoxidable), condición registrada como dañada, o una regla `replace` explícita disparada por
 *   condición.
 * - el punto de partida de cada ciclo es el snapshot de contadores del ÚLTIMO MaintenanceEvent de
 *   ese componente (o la creación del perfil si no hay eventos aún) — spec §10.
 */
import { MAINTENANCE_COMPONENTS } from '../../data/admin/printers.mock';
import type {
  MaintenanceComponent,
  MaintenanceEvent,
  MaintenanceRule,
  MaintenanceRuleSource,
  MaintenanceStatus,
  MaintenanceTrigger,
  PrinterCounters,
  PrinterProfile,
} from '../../data/admin/printers.types';
import { minutesToHours } from './format';

export interface MaintenanceAlert {
  rule: MaintenanceRule;
  component: MaintenanceComponent;
  status: MaintenanceStatus;
  reason: string;
  source: MaintenanceRuleSource;
  sourceLabel: string;
  sourceReference?: string;
  progress: { currentValue: number; thresholdValue: number; unitLabel: string } | null;
  lastEventDate?: string;
}

const STATUS_RANK: Record<MaintenanceStatus, number> = { 'up-to-date': 0, upcoming: 1, review: 2, attention: 3 };

const TRIGGER_UNIT_LABEL: Record<MaintenanceTrigger['type'], string> = {
  hours: 'h',
  printCount: 'impresiones',
  filamentGrams: 'g de filamento',
  abrasiveGrams: 'g abrasivos',
  calendarDays: 'días',
  condition: '',
};

function componentById(componentId: string): MaintenanceComponent {
  return MAINTENANCE_COMPONENTS.find((c) => c.id === componentId) ?? { id: componentId, label: componentId };
}

function ruleAppliesToProfile(rule: MaintenanceRule, printer: PrinterProfile): boolean {
  if (rule.profileScope === 'all') return true;
  return rule.profileScope.manufacturer === printer.manufacturer && rule.profileScope.model === printer.model;
}

/** Últimos eventos de un componente, más reciente primero. */
function eventsForComponent(events: MaintenanceEvent[], printerId: string, componentId: string): MaintenanceEvent[] {
  return events
    .filter((event) => event.printerId === printerId && event.componentId === componentId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
}

function counterValueForTrigger(counters: PrinterCounters, type: MaintenanceTrigger['type']): number {
  switch (type) {
    case 'hours':
      return minutesToHours(counters.printMinutesTotal);
    case 'printCount':
      return counters.printsTotal;
    case 'filamentGrams':
      return counters.filamentGramsTotal;
    case 'abrasiveGrams':
      return counters.abrasiveFilamentGramsTotal;
    default:
      return 0;
  }
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.max(0, Math.floor((to - from) / (1000 * 60 * 60 * 24)));
}

function evaluateNumericRule(rule: MaintenanceRule, printer: PrinterProfile, baselineEvent: MaintenanceEvent | undefined): MaintenanceAlert {
  const component = componentById(rule.componentId);
  const baselineCounters = baselineEvent?.counterSnapshot ?? zeroCounters();
  const baselineDate = baselineEvent?.date ?? printer.createdAt.slice(0, 10);
  const nowIso = new Date().toISOString().slice(0, 10);

  const ratios = rule.triggers.map((trigger) => {
    if (trigger.type === 'condition' || trigger.thresholdValue === undefined) return { trigger, ratio: 0, currentValue: 0 };
    if (trigger.type === 'calendarDays') {
      const currentValue = daysBetween(baselineDate, nowIso);
      return { trigger, ratio: currentValue / trigger.thresholdValue, currentValue };
    }
    const currentTotal = counterValueForTrigger(printer.counters, trigger.type);
    const baselineTotal = counterValueForTrigger(baselineCounters, trigger.type);
    const currentValue = Math.max(0, currentTotal - baselineTotal);
    return { trigger, ratio: currentValue / trigger.thresholdValue, currentValue };
  });

  const relevantRatios = ratios.filter((r) => r.trigger.type !== 'condition');
  const leading = relevantRatios.reduce((max, r) => (r.ratio > max.ratio ? r : max), relevantRatios[0] ?? { trigger: rule.triggers[0], ratio: 0, currentValue: 0 });

  const reached = rule.triggerLogic === 'all' ? relevantRatios.every((r) => r.ratio >= 1) : relevantRatios.some((r) => r.ratio >= 1);
  const approaching = rule.triggerLogic === 'all' ? relevantRatios.every((r) => r.ratio >= 0.7) : relevantRatios.some((r) => r.ratio >= 0.7);

  const status: MaintenanceStatus = reached ? 'review' : approaching ? 'upcoming' : 'up-to-date';
  const actionLabel = { inspect: 'inspección', clean: 'limpieza', lubricate: 'lubricación', replace: 'reemplazo' }[rule.action];

  const reason = reached
    ? `Alcanzó el umbral de ${actionLabel} (${Math.round(leading.currentValue).toLocaleString('es-PE')} ${TRIGGER_UNIT_LABEL[leading.trigger.type]} desde el último registro).`
    : approaching
      ? `Se acerca al umbral de ${actionLabel} (${Math.round(leading.currentValue).toLocaleString('es-PE')} de ${leading.trigger.thresholdValue} ${TRIGGER_UNIT_LABEL[leading.trigger.type]}).`
      : `Sin señales de desgaste por uso todavía (${Math.round(leading.currentValue).toLocaleString('es-PE')} de ${leading.trigger.thresholdValue} ${TRIGGER_UNIT_LABEL[leading.trigger.type]}).`;

  return {
    rule,
    component,
    status,
    reason,
    source: rule.source,
    sourceLabel: rule.sourceLabel,
    sourceReference: rule.sourceReference,
    progress: leading.trigger.thresholdValue !== undefined ? { currentValue: leading.currentValue, thresholdValue: leading.trigger.thresholdValue, unitLabel: TRIGGER_UNIT_LABEL[leading.trigger.type] } : null,
    lastEventDate: baselineEvent?.date,
  };
}

function evaluateConditionReplaceRule(rule: MaintenanceRule, printer: PrinterProfile, componentEvents: MaintenanceEvent[]): MaintenanceAlert {
  const component = componentById(rule.componentId);
  const latest = componentEvents[0];

  if (rule.materialCondition) {
    const abrasiveExposure = printer.counters.abrasiveFilamentGramsTotal > 0;
    const nozzleMatches = rule.materialCondition.requiredInstalledNozzleMaterial?.includes(printer.installedConfiguration.nozzleMaterial) ?? false;
    if (rule.materialCondition.requiresAbrasiveExposure && abrasiveExposure && nozzleMatches) {
      return {
        rule,
        component,
        status: 'attention',
        reason: `Se registró material abrasivo (CF/GF/carga dura) con boquilla instalada de ${printer.installedConfiguration.nozzleMaterial === 'stainless-steel' ? 'acero inoxidable' : printer.installedConfiguration.nozzleMaterial}. ${rule.sourceReference ?? ''}`.trim(),
        source: rule.source,
        sourceLabel: rule.sourceLabel,
        sourceReference: rule.sourceReference,
        progress: null,
      };
    }
    return {
      rule,
      component,
      status: 'up-to-date',
      reason: 'Sin exposición a material abrasivo registrada con la configuración actual.',
      source: rule.source,
      sourceLabel: rule.sourceLabel,
      sourceReference: rule.sourceReference,
      progress: null,
    };
  }

  // Reemplazo condicionado a lo encontrado en el último mantenimiento de este componente (spec §11).
  if (!latest) {
    return {
      rule,
      component,
      status: 'up-to-date',
      reason: 'Sin inspección registrada todavía — no hay señal de desgaste que evaluar.',
      source: rule.source,
      sourceLabel: rule.sourceLabel,
      sourceReference: rule.sourceReference,
      progress: null,
    };
  }
  if (latest.replacementPerformed) {
    return {
      rule,
      component,
      status: 'up-to-date',
      reason: `Repuesto reemplazado el ${latest.date}.`,
      source: rule.source,
      sourceLabel: rule.sourceLabel,
      sourceReference: rule.sourceReference,
      progress: null,
      lastEventDate: latest.date,
    };
  }
  if (latest.conditionFound === 'damaged') {
    return {
      rule,
      component,
      status: 'attention',
      reason: `Última inspección (${latest.date}) encontró la pieza dañada y no se reemplazó todavía.`,
      source: rule.source,
      sourceLabel: rule.sourceLabel,
      sourceReference: rule.sourceReference,
      progress: null,
      lastEventDate: latest.date,
    };
  }
  if (latest.conditionFound === 'wear' || latest.conditionFound === 'dirty') {
    return {
      rule,
      component,
      status: 'review',
      reason: `Última inspección (${latest.date}) encontró ${latest.conditionFound === 'wear' ? 'desgaste' : 'suciedad'} — revisa si conviene reemplazar.`,
      source: rule.source,
      sourceLabel: rule.sourceLabel,
      sourceReference: rule.sourceReference,
      progress: null,
      lastEventDate: latest.date,
    };
  }
  return {
    rule,
    component,
    status: 'up-to-date',
    reason: `Última inspección (${latest.date}) no encontró desgaste.`,
    source: rule.source,
    sourceLabel: rule.sourceLabel,
    sourceReference: rule.sourceReference,
    progress: null,
    lastEventDate: latest.date,
  };
}

function zeroCounters(): PrinterCounters {
  return {
    printMinutesTotal: 0,
    printsTotal: 0,
    printsSuccessful: 0,
    printsFailed: 0,
    filamentGramsTotal: 0,
    abrasiveFilamentGramsTotal: 0,
    filamentGramsByFamily: {},
    maintenanceEventsTotal: 0,
  };
}

export function evaluateMaintenanceRule(rule: MaintenanceRule, printer: PrinterProfile, events: MaintenanceEvent[]): MaintenanceAlert {
  const componentEvents = eventsForComponent(events, printer.id, rule.componentId);
  const isConditionOnly = rule.triggers.length === 1 && rule.triggers[0].type === 'condition';

  if (isConditionOnly) {
    return evaluateConditionReplaceRule(rule, printer, componentEvents);
  }
  return evaluateNumericRule(rule, printer, componentEvents[0]);
}

export function buildMaintenanceAlerts(printer: PrinterProfile, rules: MaintenanceRule[], events: MaintenanceEvent[]): MaintenanceAlert[] {
  return rules
    .filter((rule) => rule.enabled && ruleAppliesToProfile(rule, printer))
    .map((rule) => evaluateMaintenanceRule(rule, printer, events));
}

export function overallMaintenanceStatus(alerts: MaintenanceAlert[]): MaintenanceStatus {
  return alerts.reduce<MaintenanceStatus>((worst, alert) => (STATUS_RANK[alert.status] > STATUS_RANK[worst] ? alert.status : worst), 'up-to-date');
}

export function alertsNeedingAttention(alerts: MaintenanceAlert[]): MaintenanceAlert[] {
  return alerts.filter((a) => a.status !== 'up-to-date').sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status]);
}
