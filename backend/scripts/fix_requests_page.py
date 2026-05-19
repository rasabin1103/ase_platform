from pathlib import Path

p = Path(r"d:\workspaces\ase\ase_frontend\src\pages\RequestsPage.tsx")
t = p.read_text(encoding="utf-8")
bad_open = "                <motionless />"
bad_close = "    </motionless>"
btn = """<div className="flex gap-2">
                  <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(item.id)}>
                    {t('requestsPage.approve')}
                  </Button>
                  <Button size="sm" variant="outline" disabled={rejectMutation.isPending} onClick={() => rejectMutation.mutate(item.id)}>
                    {t('requestsPage.reject')}
                  </Button>
                TAGEND"""
btn = btn.replace("TAGEND", "</div>")
t = t.replace(bad_open, btn, 1)
t = t.replace(bad_close, "</div>", 1)
p.write_text(t, encoding="utf-8")
print("ok")
