/**
 * Post-build: genera HTML estático por ruta pública (ver seo-shells.mjs).
 *
 *  - dist/<ruta>/index.html  → título, descripción, canónica, Open Graph,
 *    JSON-LD y texto base propios de cada página (antes todas devolvían el
 *    mismo HTML vacío y sin canónica).
 *  - dist/app-shell.html     → copia GENÉRICA de la SPA, destino de las rutas
 *    dinámicas (blog, fichas, privadas). dist/index.html pasa a ser la
 *    portada con su contenido, así que no puede usarse como plantilla.
 *  - dist/404.html           → página de error con noindex; Vercel la sirve
 *    con estado 404 para toda ruta que no coincide con ninguna regla.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NOT_FOUND_SHELL, SHELLS, SITE_NAME, SITE_URL } from './seo-shells.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : join(root, 'dist')
const templatePath = join(dist, 'index.html')
if (!existsSync(templatePath)) {
  console.error('prerender-seo: falta dist/index.html; ejecuta antes `vite build`.')
  process.exit(1)
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

// Plantilla genérica: el index.html que acaba de generar Vite.
const template = readFileSync(templatePath, 'utf8')
if (!template.includes('<div id="root"></div>')) {
  console.error('prerender-seo: el HTML de Vite no contiene <div id="root"></div>.')
  process.exit(1)
}
writeFileSync(join(dist, 'app-shell.html'), template)

function setMeta(html, attr, name, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${name}"\\s+content=")[^"]*(")`, 'i')
  const multi = new RegExp(`(<meta\\s+${attr}="${name}"\\s+content=\\s*")[^"]*(")`, 'is')
  if (re.test(html)) return html.replace(re, `$1${escapeHtml(value)}$2`)
  if (multi.test(html)) return html.replace(multi, `$1${escapeHtml(value)}$2`)
  return html.replace('</head>', `  <meta ${attr}="${name}" content="${escapeHtml(value)}" />\n  </head>`)
}

function buildHtml({ path, title, description, h1, intro, links }, { noindex = false } = {}) {
  const url = `${SITE_URL}${path === '/' ? '/' : path}`
  let html = template.replace(/<link rel="canonical"[^>]*>\s*/g, '')
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
  for (const [attr, name] of [
    ['name', 'description'],
    ['property', 'og:description'],
    ['name', 'twitter:description'],
  ]) {
    html = setMeta(html, attr, name, description)
  }
  for (const [attr, name] of [
    ['property', 'og:title'],
    ['name', 'twitter:title'],
  ]) {
    html = setMeta(html, attr, name, title)
  }
  const head = []
  if (noindex) {
    head.push('<meta name="robots" content="noindex" />')
  } else {
    head.push(`<link rel="canonical" href="${url}" />`)
    head.push(`<meta property="og:url" content="${url}" />`)
  }
  if (path === '/') {
    head.push(
      jsonLd({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/icon-512.png`,
          },
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: SITE_NAME,
            inLanguage: 'es',
            publisher: { '@id': `${SITE_URL}/#organization` },
          },
        ],
      }),
    )
  } else if (!noindex) {
    head.push(
      jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: h1, item: url },
        ],
      }),
    )
  }
  head.push(
    '<style>body{margin:0;background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif}' +
      '#seo-fallback{max-width:46rem;margin:0 auto;padding:4rem 1.5rem}' +
      '#seo-fallback a{color:#7dd3fc}#seo-fallback ul{padding-left:1.2rem;line-height:1.9}</style>',
  )
  html = html.replace('</head>', `  ${head.join('\n  ')}\n  </head>`)
  const list = links.map(([href, text]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join('')
  const fallback =
    `<div id="root"><main id="seo-fallback"><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(intro)}</p>` +
    `<nav aria-label="Enlaces principales"><ul>${list}</ul></nav></main></div>` +
    '<noscript><p style="padding:1rem;color:#e2e8f0">Esta aplicación necesita JavaScript para funcionar.</p></noscript>'
  html = html.replace('<div id="root"></div>', fallback)
  return html
}

function write(file, html) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

for (const shell of SHELLS) {
  const file = shell.path === '/' ? join(dist, 'index.html') : join(dist, shell.path.slice(1), 'index.html')
  write(file, buildHtml(shell))
}
write(join(dist, '404.html'), buildHtml({ path: '/404', ...NOT_FOUND_SHELL }, { noindex: true }))
console.log(`prerender-seo: ${SHELLS.length} rutas + 404 + app-shell generadas.`)
