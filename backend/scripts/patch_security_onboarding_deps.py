"""One-off: add require_security_onboarding to sensitive route decorators."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "app" / "modules"
IMPORT = "from app.modules.auth.security_onboarding import require_security_onboarding\n"

SPECS: list[tuple[str, list[str]]] = [
    ("catalog_admin/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("pricing/router.py", ["@router.post", "@router.put", "@router.patch", "@router.delete"]),
    ("users/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("courses/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("products/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("subscriptions/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("plans/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("plan_products/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("member_roles/router.py", ["@router.post", "@router.delete"]),
    ("roles/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("permissions/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("role_permissions/router.py", ["@router.post", "@router.delete"]),
    ("organization_members/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("course_enrollments/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("services/router.py", ["@router.post", "@router.patch", "@router.delete"]),
    ("resource_assignments/router.py", ["@router.post", "@router.patch"]),
    ("consumer_catalog/router.py", ['@router.post("/{slug}/purchase"']),
    (
        "access_requests/router.py",
        ['@router.post("/{request_id}/approve"', '@router.post("/{request_id}/reject"'],
    ),
]


def patch_file(rel: str, prefixes: list[str]) -> None:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    if "require_security_onboarding" in text:
        print("skip (already)", rel)
        return
    if IMPORT.strip() not in text:
        m = re.search(r"(from app\.modules\.auth\.[^\n]+\n)", text)
        insert_at = m.end() if m else 0
        text = text[:insert_at] + IMPORT + text[insert_at:]

    def repl_dep(match: re.Match[str]) -> str:
        inner = match.group(1)
        if "require_security_onboarding" in inner:
            return match.group(0)
        return f"dependencies=[{inner}, Depends(require_security_onboarding)]"

    lines = text.split("\n")
    i = 0
    while i < len(lines):
        if any(lines[i].strip().startswith(p.split("(")[0]) for p in prefixes) or any(
            p in lines[i] for p in prefixes
        ):
            start = i
            while i < len(lines) and not lines[i].strip().startswith("def "):
                if "dependencies=[" in lines[i]:
                    lines[i] = re.sub(r"dependencies=\[([^\]]+)\]", repl_dep, lines[i], count=1)
                i += 1
            i = start + 1
            continue
        i += 1

    path.write_text("\n".join(lines) + ("\n" if text.endswith("\n") else ""), encoding="utf-8")
    print("patched", rel)


def main() -> None:
    for rel, prefixes in SPECS:
        if (ROOT / rel).exists():
            patch_file(rel, prefixes)
        else:
            print("missing", rel)


if __name__ == "__main__":
    main()
