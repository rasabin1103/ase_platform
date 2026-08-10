from pathlib import Path

CLOSE = "</motionless />".replace("motionless", "div")

BODY = f"""
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {{t('creatorApplication.fields.experience')}}
          </label>
          <textarea required minLength={{10}} value={{experience}} onChange={{(e) => setExperience(e.target.value)}} rows={{3}} className={{fieldClass}} />
        {CLOSE}
        <motionless />
"""

# fix: build BODY without bad token
BODY = """
        <motionless />
"""
BODY = """
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.experience')}
          </label>
          <textarea required minLength={10} value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} className={fieldClass} />
        </motionless />
""".replace("</motionless />", CLOSE).replace("<motionless />", "")

BODY += """
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.knowledgeAreas')}
          </label>
          <textarea required minLength={2} value={knowledgeAreas} onChange={(e) => setKnowledgeAreas(e.target.value)} rows={2} className={fieldClass} />
        </motionless />
""".replace("</motionless />", CLOSE).replace("<motionless />", "")

BODY += """
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.portfolioUrl')}
          </label>
          <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className={fieldClass} />
        </motionless />
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.motivation')}
          </label>
          <textarea required minLength={10} value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={3} className={fieldClass} />
        </motionless />
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('creatorApplication.fields.initialProposal')}
          </label>
          <textarea required minLength={10} value={initialProposal} onChange={(e) => setInitialProposal(e.target.value)} rows={3} className={fieldClass} />
        </motionless />
        <label className="flex items-start gap-2 text-sm text-ase-text2">
          <input type="checkbox" checked={qualityAgreement} onChange={(e) => setQualityAgreement(e.target.checked)} className="mt-1" />
          {t('creatorApplication.fields.qualityAgreement')}
        </label>
        {mutation.isError ? <p className="text-sm text-red-300">{t('creatorApplication.messages.submitError')}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('creatorApplication.actions.cancel')}</Button>
          <Button type="submit" disabled={!qualityAgreement || mutation.isPending}>{t('creatorApplication.actions.submit')}</Button>
        </motionless />
""".replace("</motionless />", CLOSE).replace("<motionless />", "")

src = Path(r"d:\workspaces\ase\ase_frontend\src\components\creator\CreatorApplicationModal.tsx")
head = src.read_text(encoding="utf-8")
cut = head.find("          </select>")
head = head[: cut + len("          </select>")] + "\n        </motionless />\n"
head = head.replace("</motionless />", CLOSE).replace("<motionless />", "")
src.write_text(head + BODY + "      </form>\n    </Modal>\n  )\n}\n", encoding="utf-8")
print("ok")
