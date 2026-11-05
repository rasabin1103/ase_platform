import {
  Activity,
  Blocks,
  Boxes,
  ChartColumn,
  CirclePlay,
  Compass,
  Cpu,
  Database,
  Eye,
  FileBraces,
  FlaskConical,
  GitCommitHorizontal,
  GitMerge,
  Hammer,
  Layers,
  ListChecks,
  Rocket,
  Route,
  ScanSearch,
  ShieldAlert,
  Triangle,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

/** Icono de cada servicio (independiente del idioma). */
export const SERVICE_ICON: Record<string, LucideIcon> = {
  estrategia: Compass,
  arquitectura: Layers,
  frameworks: Boxes,
  cicd: Workflow,
}

/** Icono de cada capa, en el mismo orden que `layers` del servicio. */
export const LAYER_ICONS: Record<string, LucideIcon[]> = {
  estrategia: [ScanSearch, ShieldAlert, ListChecks, Route],
  arquitectura: [Triangle, FileBraces, Database, Activity],
  frameworks: [FlaskConical, Blocks, Cpu, ChartColumn, CirclePlay],
  cicd: [GitCommitHorizontal, Hammer, GitMerge, Rocket, Eye],
}
