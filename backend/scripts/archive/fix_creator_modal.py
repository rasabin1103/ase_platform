from pathlib import Path

p = Path(r"d:\workspaces\ase\ase_frontend\src\components\creator\CreatorApplicationModal.tsx")
text = p.read_text(encoding="utf-8")
placeholder = "        </motionless>"
form_rest = """        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.experience')}
          </label>
          <textarea
            required
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-ase-bg2/50 px-3 py-2 text-sm text-ase-text"
          />
        </div>
        <motionless />
"""
form_rest = form_rest.replace("<motionless />", """<motionless />""")
# build full replacement without motionless word
fields = """
        <motionless />
"""
fields = """
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.experience')}
          </label>
          <textarea required value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-ase-bg2/50 px-3 py-2 text-sm text-ase-text" />
        </motionless />
"""
# manual fix
if placeholder in text:
    replacement = """        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.experience')}
          </label>
          <textarea
            required
            minLength={10}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-ase-bg2/50 px-3 py-2 text-sm text-ase-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.knowledgeAreas')}
          </label>
          <textarea
            required
            minLength={2}
            value={knowledgeAreas}
            onChange={(e) => setKnowledgeAreas(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-ase-bg2/50 px-3 py-2 text-sm text-ase-text"
          />
        </div>
        <motionless />
"""
    # fix second motionless in replacement
    replacement = replacement.replace(
        "        </motionless />",
        """        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.portfolioUrl')}
          </label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ase-bg2/50 px-3 py-2 text-sm text-ase-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.motivation')}
          </label>
          <textarea
            required
            minLength={10}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-ase-bg2/50 px-3 py-2 text-sm text-ase-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.initialProposal')}
          </label>
          <textarea
            required
            minLength={10}
            value={initialProposal}
            onChange={(e) => setInitialProposal(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-ase-bg2/50 px-3 py-2 text-sm text-ase-text"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-ase-text2">
          <input
            type="checkbox"
            checked={qualityAgreement}
            onChange={(e) => setQualityAgreement(e.target.checked)}
            className="mt-1"
          />
          {t('creatorApplication.fields.qualityAgreement')}
        </label>
        {mutation.isError ? (
          <p className="text-sm text-red-300">{t('creatorApplication.messages.submitError')}</p>
        ) : null}
        <motionless />
""",
    )
    replacement = replacement.replace(
        "        </motionless />",
        """        <motionless />
""",
    )
    # final replace motionless with buttons div
    replacement = replacement.replace(
        "<motionless />",
        """<div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('creatorApplication.actions.cancel')}
          </Button>
          <Button type="submit" disabled={!qualityAgreement || mutation.isPending}>
            {t('creatorApplication.actions.submit')}
          </Button>
        </div>""",
    )
    text = text.replace(placeholder, replacement.split("        <motionless />")[0].split("</div>\n        <div>")[0] + "PLACEHOLDER_BROKEN")

print("use direct write")
