export const CANON_VERSION = '2026-07-25-unified-clean-room-movement-1';

export const GAME_RULES = Object.freeze({
  platform: {
    mobileFirst: true,
    primaryOrientation: 'landscape',
    targetViewport: 'iPhone 14 Pro Max',
    strictSideScrollingPlane: true,
    freeDepthMovement: false,
    presentation: 'fully rendered 3D assets on a linear 2.75D gameplay plane',
    gameplayReadabilityScale: Object.freeze({
      commonEnemyRelativeToHargold: 'knee-to-waist height',
      hargoldApproximateCommonEnemyHeights: Object.freeze({ minimum: 2, maximum: 3 }),
      terrainBlocksAreCollisionBearing: true,
      visiblePlatformsAreCollisionBearing: true
    })
  },
  characterPresentation: {
    construction: 'complete-3d-skinned-models',
    environment: 'fully-rendered-3d',
    gameplayPlane: 'strict-linear-side-scrolling',
    classification: '2.75D',
    orientation: Object.freeze({
      mode: 'controlled-three-quarter-side',
      cameraBiasDegrees: 14,
      revealDegreesByAction: Object.freeze({
        default: 14,
        idle: 18,
        walk: 16,
        run: 14,
        sprint: 11,
        start: 18,
        stop: 24,
        'turn-low': 32,
        skid: 28,
        airborne: 16,
        'air-spin': 20,
        'ground-slam': 14,
        glide: 22,
        hurt: 26,
        victory: 24
      }),
      turnTowardCameraForReadability: true,
      physicalDirectionChange: true,
      negativeScaleMirroringForbidden: true
    }),
    gameplayScale: Object.freeze({
      gamePixelsPerMetre: 70,
      heroHeightMetres: Object.freeze({
        Hargold: 1.82,
        Mebble: 2.18
      }),
      heroHeightRatioMebbleToHargold: 1.198,
      commonMobHeightMetres: Object.freeze({
        minimum: 0.62,
        maximum: 0.76
      }),
      standardBlockHeightMetres: 0.74,
      visibleSilhouetteMayExceedColliderForAccessories: true,
      finalBlenderAssetsMustUseGameplayMetres: true
    }),
    animation: Object.freeze({
      gameplayDriven: true,
      distinctJumpStages: Object.freeze([
        'anticipation',
        'takeoff',
        'ascent',
        'apex',
        'descent',
        'contact',
        'compression',
        'recovery'
      ]),
      speedMatchedFootContacts: true,
      forwardLeanAtRunAndSprint: true,
      squashStretchOverlapAndFollowThrough: true
    }),
    productionTarget: 'assets/references/Hargold and Mebble approved production target.png',
    productionTargetSha256: 'A236AB062EE5FA8390CDDA7BA5EC21A7B4989CCB82F375CF34435E7A5B5FC05D',
    validationRequiredInNeutralAndGameplayCamera: true
  },
  movement: {
    variableJump: true,
    coyoteTimeAllowed: true,
    jumpBufferAllowed: true,
    sharedHorizontalBaseTuning: true,
    locomotionTargets: Object.freeze(['walk', 'run', 'sprint']),
    requiredCharacterStates: Object.freeze([
      'idle', 'walk', 'run', 'sprint', 'crouch', 'crawl', 'slide',
      'rolling-momentum', 'wall-reaction', 'ledge-stop', 'jump',
      'variable-jump', 'stomp-bounce', 'ground-slam', 'skid',
      'quick-direction-reversal', 'look-up', 'duck', 'landing-recovery',
      'hurt', 'victory'
    ]),
    wallJump: Object.freeze({
      Hargold: false,
      Mebble: false,
      status: 'not-enabled-without-a-future-explicit-rule'
    }),
    airTwirl: Object.freeze({
      universalBeforeHargoldDoubleJumpUnlock: true,
      input: 'fresh airborne jump press',
      oncePerAirborneSequence: true,
      boundedHangTime: true,
      grantsAdditionalJump: false
    }),
    groundSlam: Object.freeze({
      universal: true,
      input: 'fresh airborne down-or-slam press',
      phases: Object.freeze(['startup', 'descent', 'impact', 'recovery'])
    }),
    hargoldDoubleJump: { learnedSkill: true, availableByDefault: false },
    mebbleHigherJump: true,
    mebbleCapeGlide: true,
    allRequiredJumpsReachableByHargold: true
  },
  heroGating: {
    mebbleRequiredObstacleGroupsPerLevel: { minimum: 1, maximum: 2 },
    hargoldOnlyBlocksPerLevel: 'several',
    avoidRepeatedMainRouteBacktrackingSwaps: true,
    extraSwapsReservedForOptionalRoutesSecretsAndCompassCoins: true
  },
  levelConstruction: {
    individuallyAuthoredCourses: true,
    supportedTerrainRatio: Object.freeze({ minimum: 0.8, maximum: 0.9 }),
    pitRatio: Object.freeze({ minimum: 0.1, maximum: 0.2 }),
    avoidLongFlatRuns: true,
    terrainDrivenChallenge: true,
    denseCoinGuidance: true,
    preserveApprovedWorldOneBackgroundDirection: true,
    environmentPresentation: Object.freeze({
      minimumVisualBenchmark: 'approved-Meadow-Wake-reference-image',
      preserveLightingAtmosphereDepthAndPalette: true,
      collisionBearingForegroundMustBeFullyModeled: true,
      layeredParallaxBands: Object.freeze([
        'playable-foreground',
        'authored-midground',
        'far-background'
      ]),
      integrateBlocksCoinsAndMechanismsIntoTerrain: true,
      prioritizeGameplayReadability: true,
      wholeCourseConsistencyRequired: true,
      proceduralReplacementForbidden: true,
      outdoorGameplayRoomsRequired: true,
      heroLandmarkPerRoomRequired: true,
      landmarksMustConnectToCollisionBearingTraversal: true,
      blocksMustBelongToNamedGameplayPhrases: true
    }),
    mechanismTypes: Object.freeze([
      'moving-platform',
      'falling-platform',
      'rotating-platform',
      'lift',
      'seesaw',
      'bridge'
    ])
  },
  health: {
    heartsAndLivesSeparate: true,
    maximumSurvivableHealthLayers: 3,
    defaultStartingLives: 3,
    maximumLives: 99,
    coinsPerExtraLife: 100,
    retainExcessCoins: true,
    instantDeathHazards: ['pit', 'lava', 'poison'],
    instantDeathBypasses: ['hearts', 'invulnerability', 'activePowerUp']
  },
  checkpoints: {
    respawnAtLatestReachedCheckpoint: true,
    restartLevelWhenNoCheckpoint: true,
    bossDamageResetsAfterLifeLoss: true
  },
  collectibles: {
    standardCollectibleName: 'Compass Coin',
    perLevel: 3,
    totalCampaignSlots: 270
  },
  blocks: {
    exactStandardTypeCount: 4,
    types: ['standard-breakable', 'hargold-only', 'coin', 'power-up'],
    coinBlockUsesCoinSymbol: true,
    standardBreakRequiresApprovedStrengthOrAction: true,
    hargoldOnlyRejectsMebble: true,
    rollingShellBreaksStandardOnly: true,
    spentRewardBlocksRemainSolid: true,
    hiddenBlocksBecomeSolidOnReveal: true,
    requiredFeedback: Object.freeze([
      'bump-displacement',
      'squash-recovery',
      'impact-response',
      'outcome-specific-reward-or-debris'
    ]),
    coinRewardPercentages: Object.freeze({ 1: 78, 5: 14, 10: 7, 100: 1 })
  },
  powerUps: [
    'Grow/Size',
    'Fire',
    'Ice',
    'Bubblebloom Charm',
    'Stonefist Gloves',
    'Mebble Glide Cape (innate)',
    'Open movement/exploration slot',
    'Ultra-rare timed power-up (not in boss levels)'
  ],
  combat: {
    mostCommonEnemiesOneHit: true,
    campChipperOneHit: true,
    spikedEnemiesDamageUnsafeStomps: true,
    configuredFireEnemiesRequireIce: true,
    heavyRockEnemiesRequireHargoldGroundSlam: true,
    tidebiterWaterOnly: true
  },
  bosses: {
    requiredDamageEvents: 5,
    ultraRarePowerUpAllowed: false,
    humanBossException: 'Camp Head'
  },
  campaign: {
    worlds: 10,
    completionSlotsPerWorld: 9,
    totalCompletionSlots: 90,
    mainWorlds: [1, 2, 3, 4, 5, 6, 7],
    secretWorlds: [8, 9],
    finalWorld: 10,
    finalWorldUnlock: '100% completion of Worlds 1-9, including both secret worlds',
    difficultyModes: ['Easy', 'Normal', 'Hard', 'Nightmare']
  },
  communication: {
    spokenDialogue: false,
    lipSyncRequired: false,
    localizationBackedTextBubbles: true,
    originalNonverbalHeroVocalizations: true
  }
});

const WORLD_ONE_LEVELS = [
  {
    slot: 1,
    id: '1-1',
    name: 'Meadow Wake',
    role: 'movement, jumping, swapping and basic-block tutorial',
    enemies: ['Camp Critter', 'Shellback'],
    foregroundDirective: Object.freeze({
      targetSupportedTerrainRatio: 0.85,
      connectedGroundProgressionRatio: Object.freeze({ minimum: 0.65, maximum: 0.75 }),
      authoredRouteComposition: Object.freeze({
        connectedGround: 0.7,
        optionalElevated: 0.2,
        dedicatedPlatformSequences: 0.1
      }),
      authoredCourseLength: 124,
      preserveExistingValleyArtDirection: true,
      obstacleEmphasis: 'terrain, blocks, coins, routes, and platform mechanisms',
      environmentQualityFloor: 'approved-Meadow-Wake-reference-image',
      authoredVisualBeatCount: 7,
      authoredTraversalPhaseCount: 9,
      authoredOutdoorRoomCount: 12,
      heroLandmarkCadenceSeconds: Object.freeze({ minimum: 8, maximum: 10 }),
      landmarkDrivenTraversal: true,
      blocksUseNamedGameplayPhrases: true,
      outdoorRooms: Object.freeze([
        'Trailhead Camp',
        'Elder Root Walk',
        'Mason Shelf',
        'Shellback Quarry',
        'Timberyard Clearing',
        'Stump Creek Hollow',
        'Lantern Bridge',
        'Mill Meadow',
        'Root Terrace',
        'Lookout Ruins',
        'Flowering Run',
        'Three-Gap Vista'
      ]),
      finishAllSectionsToSharedQualityFloor: true,
      trueGapClusters: Object.freeze([
        'concealed-creek-pocket-with-recovery-shelf',
        'framed-rope-bridge-ravine',
        'graduated-exit-panorama'
      ]),
      visibleTerrainConstruction: 'explicit-irregular-modular-3d-chunks-with-clean-collision'
    })
  },
  {
    slot: 2,
    id: '1-2',
    name: 'Acorn Run',
    role: 'rolling slopes and Acorn Bomber hazards',
    enemies: ['Acorn Bomber']
  },
  {
    slot: 3,
    id: '1-3',
    name: 'Burrowbank',
    role: 'tunnels and burrowing hazards',
    enemies: ['Dirt Squirt', 'Spike Beetle']
  },
  {
    slot: 4,
    id: '1-4',
    name: 'Sentry Span',
    role: 'Camp Sentry projectile timing',
    enemies: ['Camp Sentry']
  },
  {
    slot: 5,
    id: '1-5',
    name: 'Ruin Rise',
    role: 'vertical platforming and Hargold-only blocks'
  },
  {
    slot: 6,
    id: '1-6',
    name: 'Glideway',
    role: 'Mebble cape-glide training'
  },
  {
    slot: 7,
    id: '1-7',
    name: 'Cliffline Fork',
    role: 'player selects one of two meaningfully different route variants',
    routeVariants: [
      { id: '1-7A', name: null, status: 'name-and-layout-pending' },
      { id: '1-7B', name: null, status: 'name-and-layout-pending' }
    ]
  },
  {
    slot: 8,
    id: '1-8',
    name: 'Verdant Gate',
    role: 'castle/arena approach and Verdant Wyrm world finale',
    boss: 'Verdant Wyrm'
  },
  {
    slot: 9,
    id: '1-9',
    name: null,
    role: 'secret level unlocked by Verdant Vale hidden exit',
    secret: true,
    status: 'name-and-layout-pending'
  }
];

const WORLD_DEFINITIONS = [
  { number: 1, name: 'Verdant Vale', kind: 'main', theme: 'bright grasslands, rolling hills, streams, woodland edges and stone ruins', boss: 'Verdant Wyrm', difficultyPosition: 'easiest' },
  { number: 2, name: 'Tideglass Coast', kind: 'main', theme: 'coastal cliffs, flooded coves, tidal caves and water mobility', boss: 'Wraithbound' },
  { number: 3, name: 'Crystal Dunes', kind: 'main', theme: 'desert and crystal terrain, shifting sand hazards and crystal spires', boss: 'Luminite Golem' },
  { number: 4, name: 'Skyreach Range', kind: 'main', theme: 'high-altitude wind, aerial lifts and moving platforms', boss: 'Altitude Archmage' },
  { number: 5, name: 'Ember Rift', kind: 'main', theme: 'volcano, heat and eruption hazards', boss: 'Sand Wraith' },
  { number: 6, name: 'Overgrown Grove', kind: 'main', theme: 'dense forest and camp-industrial intrusion', boss: 'Camp Head', difficultyPosition: 'second-hardest main world' },
  { number: 7, name: 'Toxic Fen', kind: 'main', theme: 'poison river, swamp, sluices and toxic hazards', boss: 'Fen Phantasm', difficultyPosition: 'hardest main world' },
  { number: 8, name: 'Secret World A', kind: 'secret', theme: 'hidden expert world; exact world title/theme remains subject to current canon review', boss: 'Bone Crusher', difficultyPosition: 'harder than every main world' },
  { number: 9, name: 'Secret World B', kind: 'secret', theme: 'hidden expert world; exact world title/theme remains subject to current canon review', boss: 'Tempest Warden', difficultyPosition: 'harder than every main world' },
  { number: 10, name: 'Final World', kind: 'final', theme: '100%-completion postgame world; exact title and detailed theme remain open', boss: null, difficultyPosition: 'substantially hardest overall' }
];

function pendingLevels(worldNumber) {
  return Array.from({ length: 9 }, (_, index) => {
    const slot = index + 1;
    return {
      slot,
      id: `${worldNumber}-${slot}`,
      name: null,
      status: 'canonical-name-and-detailed-layout-pending',
      compassCoins: 3,
      checkpointRequired: true,
      strictSideScrollingPlane: true,
      wallJumpAvailableToBothHeroes: false,
      hargoldRequiredJumpReachability: true,
      mebbleRequiredObstacleGroups: { minimum: 1, maximum: 2, grouped: true },
      hargoldOnlyBlockRequirement: 'several',
      avoidRepeatedMainRouteSwapping: true,
      secret: slot === 9
    };
  });
}

export const CAMPAIGN = Object.freeze(WORLD_DEFINITIONS.map(world => Object.freeze({
  ...world,
  levels: Object.freeze(world.number === 1 ? WORLD_ONE_LEVELS : pendingLevels(world.number)),
  routeStructure: Object.freeze({
    mainCompletionSlots: 8,
    forkSlotHasTwoAlternativeRoutes: true,
    oneAlternativeMustBeCompleted: true,
    secretNinthSlot: true,
    hiddenExitCount: 1,
    compassCoinsPerCompletionSlot: 3
  })
})));

export const LOCKED_HERO_DESIGN = Object.freeze({
  Hargold: {
    reference: 'assets/references/Hargold locked production character sheet.png',
    approvedProductionTarget: 'assets/references/Hargold and Mebble approved production target.png',
    approvedProductionTargetSha256: 'A236AB062EE5FA8390CDDA7BA5EC21A7B4989CCB82F375CF34435E7A5B5FC05D',
    build: 'very short, very round/heavy and wider than Mebble',
    clothing: ['layered olive-green explorer jacket', 'tan shirt', 'wide-brim olive-green hat with brown band and orange feather', 'deep red-brown wrapped scarf/cape collar', 'brown field backpack with leaf badge', 'brown belt and explorer pouches', 'brown boots', 'brass-colored hardware'],
    face: ['dark moustache and rounded chin beard/goatee treatment from locked sheet', 'round friendly features', 'moderate—not exaggerated—smile'],
    gameplay: ['shared horizontal base-controller tuning', 'Hargold-only block breaking', 'heavy-rock ground-slam defeats', 'exclusive learned double jump'],
    productionModel: ['new original artist-authored geometry built from an empty Blender scene', 'do not reuse the rejected doll-like procedural geometry or substitute a generic humanoid base', 'continuous skinned body and soft-garment surfaces with no rigid segmented limbs', 'smooth rounded deformation topology', 'sculpted face and expressive eyebrows', 'detailed hands and boots', 'layered clothing with authored folds', 'clean UVs and optimized LOD-ready topology', 'action-pose and gameplay-camera deformation approval', '100–150 pixel silhouette approval', 'deformable shoulder volume with separated arms', 'longer readable forearms and hands enlarged roughly 20–30 percent over the rejected candidate', 'larger stable boot silhouette', 'soft integrated cheek transitions'],
    productionRig: ['IK/FK limbs', 'finger articulation', 'eye, eyebrow, jaw and mouth controls', 'gameplay sockets', 'hat, feather and scarf secondary controls'],
    productionAnimation: ['new original gameplay clips', 'anticipation and controlled squash/stretch', 'follow-through and overlapping secondary motion', 'reliable foot contacts', 'seamless state blending']
  },
  Mebble: {
    reference: 'assets/references/Mebble locked production character sheet.png',
    approvedProductionTarget: 'assets/references/Hargold and Mebble approved production target.png',
    approvedProductionTargetSha256: 'A236AB062EE5FA8390CDDA7BA5EC21A7B4989CCB82F375CF34435E7A5B5FC05D',
    build: 'taller and thinner than Hargold',
    definingFeatures: ['very long skinny neck', 'clearly visible protruding Adam’s apple', 'small brown top hat with green band and leaf detail', 'slightly crooked less-round glasses', 'very bushy eyebrows'],
    clothing: ['cream rolled-sleeve shirt', 'brown vest', 'dark trousers', 'double belts and explorer pouches', 'tall brown lace-up boots', 'green emblem cape that opens as parachute/glider'],
    gameplay: ['shared horizontal base-controller tuning', 'slightly higher jump', 'innate slow-fall and short glide'],
    productionModel: ['new original artist-authored geometry built from an empty Blender scene', 'do not reuse the rejected doll-like procedural geometry or substitute a generic humanoid base', 'continuous skinned body and soft-garment surfaces with no rigid segmented limbs', 'smooth rounded deformation topology', 'sculpted face and expressive eyebrows', 'detailed hands and boots', 'layered clothing with authored folds', 'clean UVs and optimized LOD-ready topology', 'action-pose and gameplay-camera deformation approval', '100–150 pixel silhouette approval', 'deformable shoulder volume with arms separated from vest and cape', 'modestly wider torso with larger hands and boots', 'tapered visible neck and stronger Adam’s apple profile', 'glasses offset from the face and curved cape shoulder yoke'],
    productionRig: ['IK/FK limbs', 'finger articulation', 'eye, eyebrow, jaw and mouth controls', 'gameplay sockets', 'neck corrective and cape secondary controls'],
    productionAnimation: ['new original gameplay clips', 'anticipation and controlled squash/stretch', 'follow-through and overlapping secondary motion', 'reliable foot contacts', 'seamless state blending'],
    visibilityRule: 'neck and Adam’s apple may not be hidden by collar, cape, pose or lighting'
  }
});

export function getWorld(worldNumber) {
  return CAMPAIGN.find(world => world.number === worldNumber) ?? null;
}

export function getLevel(levelId) {
  for (const world of CAMPAIGN) {
    const level = world.levels.find(entry => entry.id === levelId);
    if (level) return level;
  }
  return null;
}
