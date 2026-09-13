import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { TERRAIN_FINISH_VERSION } from '../src/environment/meadow-wake-living-terrain.js';

const output = process.env.HM_CAPTURE_OUTPUT ?? '/tmp/meadow-wake-terrain';
const base = process.env.HM_CAPTURE_URL ?? 'http://127.0.0.1:4173';
await mkdir(output, { recursive: true });
let commit = 'local-uncommitted';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* local ZIP */ }
const browser = await chromium.launch({ headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const views = [
  { name:'terrain-opening', x:8.4 }, { name:'terrain-quarry', x:35.2 },
  { name:'terrain-creek', x:59.2 }, { name:'terrain-finale', x:118.2 },
  { name:'terrain-mobile', x:8.4, width:932, height:430 },
  { name:'terrain-collision-overlay', x:59.2, query:'debugTerrain=overlay' }
];
const report = { status:'running', commit, version:TERRAIN_FINISH_VERSION,
  scope:'terrain-only runtime/geometry validation; screenshots require visual review', views:[] };
try {
  for (const view of views) {
    const context=await browser.newContext({ viewport:{width:view.width??1536,height:view.height??864}, deviceScaleFactor:1 });
    const page=await context.newPage(), errors=[], failures=[], referenceRequests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{ if(m.type()==='error') errors.push(m.text()); });
    page.on('response',r=>{ if(r.status()>=400&&!r.url().endsWith('/favicon.ico')) failures.push(`${r.status()} ${r.url()}`); });
    page.on('request',r=>{ if(r.url().includes('/assets/references/')) referenceRequests.push(r.url()); });
    try {
      await page.goto(`${base}/?artPreview=${view.x}&qaRoute=1&${view.query??''}`, {waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForFunction(()=> (document.querySelector('#status')?.textContent??'')
        .includes('3D characters + layered Meadow Wake environment ready'),null,{timeout:60000});
      await page.waitForFunction(()=>window.__HM_TERRAIN_FINISH_QA__?.texturesReady===true,null,{timeout:30000});
      await page.waitForTimeout(1200);
      const metrics=await page.evaluate(()=>({status:document.querySelector('#status')?.textContent,
        terrain:window.__HM_TERRAIN_METRICS__??null,surface:window.__HM_TERRAIN_FINISH_QA__??null,route:window.__HM_ROUTE_QA__??null}));
      await page.screenshot({path:`${output}/${view.name}-full.png`,timeout:60000});
      const qa=metrics.surface;
      const ready=qa?.version===TERRAIN_FINISH_VERSION&&qa?.moduleCount===25&&qa?.roomCount===12
        &&qa?.ledgeCount>=10&&qa?.legacyPassesActive===0&&qa?.collisionBearing===false
        &&qa?.referenceImagesInScene===false&&referenceRequests.length===0;
      report.views.push({...view,ready,errors,failures,referenceRequests,...metrics});
    } catch(error) {
      report.views.push({...view,ready:false,errors:[...errors,String(error)],failures,referenceRequests});
      await page.screenshot({path:`${output}/${view.name}-failed.png`,timeout:10000}).catch(()=>{});
    } finally { await context.close(); }
  }
  report.status=report.views.length===views.length&&report.views.every(v=>v.ready&&!v.errors.length&&!v.failures.length)
    ?'pass-runtime-and-terrain-captures':'fail';
} finally {
  await browser.close();
  await writeFile(`${output}/terrain-browser-report.json`,JSON.stringify(report,null,2));
  await writeFile(`${output}/TESTED_COMMIT.txt`,`${commit}\n`);
}
if(report.status!=='pass-runtime-and-terrain-captures') process.exitCode=1;
