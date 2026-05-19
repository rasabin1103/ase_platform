from pathlib import Path

lines = [
    "import { NavLink } from 'react-router-dom'",
    "import { useI18n } from '../../i18n'",
    "import type { NavGroupDef } from '../../rbac/config'",
    "import { cn } from '../ui/cn'",
    "",
    "const linkBase =",
    "  'group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition duration-200'",
    "",
    "type Props = { groups: NavGroupDef[] }",
    "",
    "export function SidebarNavGroups({ groups }: Props) {",
    "  const { t } = useI18n()",
    "  return (",
    "    <>",
    "      {groups.map((group) => (",
    '        <motionless />',
    "      ))}",
    "    </>",
    "  )",
    "}",
]
# line 18 is wrong - fix it
lines[17] = '        <div key={group.labelKey} className="mb-5">'
lines.insert(18, '          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ase-muted">')
lines.insert(19, "            {t(group.labelKey)}")
lines.insert(20, "          </div>")
lines.insert(21, '          <motionless />')
lines.insert(22, "        </div>")

# fix line 21
inner = [
    '          <div className="space-y-1.5">',
    "            {group.items.map((item) => (",
    "              <NavLink",
    "                key={item.to}",
    "                to={item.to}",
    "                className={({ isActive }) =>",
    "                  cn(",
    "                    linkBase,",
    "                    isActive",
    "                      ? 'border-cyan-300/20 bg-cyan-300/10 text-ase-text shadow-[0_0_28px_rgba(34,211,238,0.10)]'",
    "                      : 'border-transparent text-ase-text2 hover:border-white/10 hover:bg-white/[0.045] hover:text-ase-text',",
    "                  )",
    "                }",
    "              >",
    '                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-xs text-ase-text">',
    "                  {item.icon}",
    "                </span>",
    '                <span className="min-w-0 truncate">{t(item.labelKey)}</span>',
    '                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current opacity-0 transition group-[.active]:opacity-100" />',
    "              </NavLink>",
    "            ))}",
    "          </div>",
]
lines[21] = inner[0]
for i, L in enumerate(inner[1:], start=22):
    lines.insert(i, L)

Path(r"d:\workspaces\ase\ase_frontend\src\components\layout\SidebarNavGroups.tsx").write_text(
    "\n".join(lines) + "\n",
    encoding="utf-8",
)

sidebar_lines = [
    "import { BrandLogo } from '../brand/BrandLogo'",
    "import { useRbac } from '../../rbac/useRbac'",
    "import { SidebarNavGroups } from './SidebarNavGroups'",
    "",
    "export function Sidebar() {",
    "  const { navGroups } = useRbac()",
    "  return (",
    '    <aside className="relative h-full w-72 shrink-0 overflow-hidden border-r border-white/[0.08] bg-ase-bg2/95">',
    '      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_42%)]" />',
    '      <motionless />',
    "    </aside>",
    "  )",
    "}",
]
sidebar_lines[8] = '      <motionless />'
sidebar_lines[8] = '      <div className="relative px-5 py-5">'
sidebar_lines.insert(9, '        <BrandLogo variant="icon" size="sm" showText className="justify-start" />')
sidebar_lines.insert(10, "      </div>")
sidebar_lines.insert(11, '      <nav className="relative h-[calc(100%-84px)] overflow-y-auto px-3 pb-5">')
sidebar_lines.insert(12, "        <SidebarNavGroups groups={navGroups} />")
sidebar_lines.insert(13, "      </nav>")

Path(r"d:\workspaces\ase\ase_frontend\src\components\layout\Sidebar.tsx").write_text(
    "\n".join(sidebar_lines) + "\n",
    encoding="utf-8",
)
print("done")
