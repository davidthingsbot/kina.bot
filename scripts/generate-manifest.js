import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const slidesDir = join(root, 'public', 'slides')
const outFile = join(root, 'src', 'slides.json')

let files = []
try {
  files = readdirSync(slidesDir)
    .filter((f) => /\.png$/i.test(f))
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    )
} catch {
  // public/slides not present yet — emit an empty manifest
}

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, JSON.stringify(files, null, 2) + '\n')
console.log(`slides manifest: ${files.length} file(s) -> src/slides.json`)
