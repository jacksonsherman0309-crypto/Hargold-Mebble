from pathlib import Path

path = Path('src/character-renderer.js')
text = path.read_text()

production_import = "import { MeadowWakeOpeningProductionArt } from './environment/meadow-wake-opening-production-art.js?v=opening-production-1';\n"
polish_import = "import { MeadowWakeOpeningPolish } from './environment/meadow-wake-opening-polish.js?v=opening-production-2';\n"
anchor = "import { MeadowWakeForegroundArt } from './environment/meadow-wake-foreground.js?v=level-one-layout-20260911';\n"
if production_import not in text:
    if anchor not in text:
        raise SystemExit('foreground import anchor not found')
    text = text.replace(anchor, anchor + production_import, 1)
if polish_import not in text:
    if production_import not in text:
        raise SystemExit('production import anchor not found')
    text = text.replace(production_import, production_import + polish_import, 1)

build_anchor = "    this.buildMeadowWake();\n"
production_integration = """    this.buildMeadowWake();\n    this.openingProductionArt = new MeadowWakeOpeningProductionArt({\n      world: this.world,\n      height: this.height,\n      platformSlots: this.platformSlots,\n      blockSlots: this.blockSlots\n    });\n    this.openingProductionArt.build();\n"""
if 'this.openingProductionArt = new MeadowWakeOpeningProductionArt' not in text:
    if build_anchor not in text:
        raise SystemExit('buildMeadowWake anchor not found')
    text = text.replace(build_anchor, production_integration, 1)

polish_integration = """    this.openingProductionPolish = new MeadowWakeOpeningPolish({\n      world: this.world,\n      height: this.height\n    });\n    this.openingProductionPolish.build();\n"""
if 'this.openingProductionPolish = new MeadowWakeOpeningPolish' not in text:
    marker = "    this.openingProductionArt.build();\n"
    if marker not in text:
        raise SystemExit('opening production-art build marker not found')
    text = text.replace(marker, marker + polish_integration, 1)

path.write_text(text)
print('Integrated production opening art and second-pass polish into character renderer')
