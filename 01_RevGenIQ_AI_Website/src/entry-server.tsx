import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'

// Used only at build time (see scripts/prerender.mjs) to bake real, crawlable
// HTML into each route — the AI knowledge-base crawler (and search engines)
// can't execute JavaScript, so without this every page is just an empty
// <div id="root"> to anything that doesn't run a browser. The live site's
// behavior for real visitors is unchanged: main.tsx still mounts a normal
// client-rendered React app on top of this static markup.
export function render(url: string): string {
  return renderToStaticMarkup(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  )
}
