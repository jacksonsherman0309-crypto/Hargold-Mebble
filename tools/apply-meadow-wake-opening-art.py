from pathlib import Path

path = Path('src/character-renderer.js')
text = path.read_text()

import_line = "import { MeadowWakeOpeningProductionArt } from './environment/meadow-wake-opening-production-art.js?v=opening-production-1';\n"
anchor = "import { MeadowWakeForegroundArt } from './environment/meadow-wake-foreground.js?v=level-one-layout-20260911';\n"
if import_line not in text:
    if anchor not in text:
        raise SystemExit('foreground import anchor not found')
    text = text.replace(anchor, anchor + import_line, 1)

build_anchor = "    this.buildMeadowWake();\n"
integration = """    this.buildMeadowWake();\n    this.openingProductionArt = new MeadowWakeOpeningProductionArt({\n      world: this.world,\n      height: this.height,\n      platformSlots: this.platformSlots,\n      blockSlots: this.blockSlots\n    });\n    this.openingProductionArt.build();\n"""
if 'this.openingProductionArt = new MeadowWakeOpeningProductionArt' not in text:
    if build_anchor not in text:
        raise SystemExit('buildMeadowWake anchor not found')
    text = text.replace(build_anchor, integration, 1)

path.write_text(text)
print('Integrated production opening art into character renderer')
