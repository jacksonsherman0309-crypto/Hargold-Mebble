# Character production checklist

Last updated: July 30, 2026

The machine-readable authority is
`assets/blender/character-production-checklist.json`.

The original Meshy Hargold and Mebble meshes and 24-bone rigs are locked. The
animation pass may add clips, state-machine logic, contact correction,
validation tooling, and future reviewed controls to those exact assets. It may
not replace their visible meshes or select another base rig.

## Current gate: locked-rig animation refinement

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
