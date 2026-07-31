# Character production checklist

Last updated: July 31, 2026

The machine-readable authority is
`assets/blender/character-production-checklist.json`.

The visible Meshy Hargold and Mebble identities remain locked. The current
24-bone rigs are now interim runtime, migration, diagnostic, and rollback
assets rather than the final authoring target. The authoritative production
order is `docs/rig-first-character-production-gate-2026-07-31.md`.

## Current gate: production Blender rigs first

- [x] Stage 0 live GLBs preserved at byte-identical rollback paths
- [x] Stage 0 hashes, meshes, skins, materials, bind height, facing, foot origin, sockets, and runtime paths recorded
- [x] Stage 1 Hargold editable Blender source created
- [x] Stage 1 Mebble editable Blender source created
- [x] Canonical static bind surfaces floor-aligned at 1.82 m and 2.2932 m, scale `1,1,1`
- [x] Imported Meshy actions removed from production authoring sources
- [x] Original production-rig and semantic-control scaffolds created and clearly marked unskinned/not live
- [ ] Stage 1 production topology approved
- [ ] Stage 2 purposeful skeletons, constraints, and IK/FK approved
- [ ] Stage 3 skinning, weights, and correctives approved
- [ ] Stage 4 face, hand, and accessory systems approved
- [ ] Stage 5 enlarged static/action pose gate passed
- [ ] Stage 6 versioned candidate GLBs and semantic integration complete
- [ ] Stage 7 runtime parity and rollback validation passed
- [ ] Stage 8 final animation production allowed

The earlier interim-runtime checklist remains useful only for regression and
diagnostic coverage:

- [x] Locked original Meshy models selected
- [x] Rejected altered/procedural models quarantined
- [x] Supplied walk and run retained as replaceable reference/debug clips
- [x] Refined project-authored walk, run, and full-speed sprint cycles active
- [x] Automatic walk-to-full-run acceleration; no manual run/sprint action
- [x] Shared body-state presentation library
- [x] Hargold double-jump body clip
- [x] Mebble glide body clips
- [x] Velocity-linked locomotion, phase synchronization, and responsive blends
- [x] Foot-height correction and bounded slope adaptation
- [x] Buffered four-phase ground slam with live impact feedback and mob contact
- [x] Live validation stations and animation debug surface
- [ ] Joint-deformation visual stress approval
- [ ] Facial controls and facial animation
- [ ] Finger bones and hand/finger poses
- [ ] Independent cape, scarf, hat, feather, glasses, belt, and backpack motion
- [ ] Corrective shapes or corrective bones
- [ ] Complete live gameplay visual pass
- [ ] LOD generation and mobile profiling
- [ ] Export-ready production approval

The facial, finger, accessory, and corrective boxes cannot be checked with the
present source GLBs: both rigs have 24 body bones and zero morph targets.
Documentation and body poses are not substitutes for those missing controls.

No unchecked item may be reported as complete without a saved source asset,
runtime integration where applicable, automated validation where practical,
and gameplay-camera visual evidence.
