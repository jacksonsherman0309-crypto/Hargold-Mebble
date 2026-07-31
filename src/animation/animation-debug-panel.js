import { IMPORTED_CHARACTER_ANIMATIONS } from './character-animation-config.js';

function option(value, label = value) {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = label;
  return element;
}

function control(label, input) {
  const wrapper = document.createElement('label');
  wrapper.className = 'animation-debug-control';
  const caption = document.createElement('span');
  caption.textContent = label;
  wrapper.append(caption, input);
  return wrapper;
}

export class AnimationDebugPanel {
  constructor({
    renderer,
    getGameplaySnapshot,
    onHeroRequested,
    startInGameplay = false
  }) {
    this.renderer = renderer;
    this.getGameplaySnapshot = getGameplaySnapshot;
    this.onHeroRequested = onHeroRequested;
    this.root = document.createElement('aside');
    this.root.className = 'animation-debug-panel';
    this.root.setAttribute('aria-label', 'Developer animation testing');
    this.root.innerHTML = '<h2>Animation Debug</h2>';

    this.hero = document.createElement('select');
    this.hero.append(option('Hargold'), option('Mebble'));
    this.clip = document.createElement('select');
    this.pause = document.createElement('input');
    this.pause.type = 'checkbox';
    this.speed = document.createElement('input');
    this.speed.type = 'range';
    this.speed.min = '0.1';
    this.speed.max = '2';
    this.speed.step = '0.05';
    this.speed.value = '1';
    this.loop = document.createElement('input');
    this.loop.type = 'checkbox';
    this.loop.checked = true;
    this.scrub = document.createElement('input');
    this.scrub.type = 'range';
    this.scrub.min = '0';
    this.scrub.max = '1';
    this.scrub.step = '0.001';
    this.scrub.value = '0';
    this.facing = document.createElement('select');
    this.facing.append(option('1', 'Right'), option('-1', 'Left'));
    this.restart = document.createElement('button');
    this.restart.type = 'button';
    this.restart.textContent = 'Restart clip';
    this.release = document.createElement('button');
    this.release.type = 'button';
    this.release.textContent = 'Return to gameplay';
    this.telemetry = document.createElement('pre');
    this.telemetry.className = 'animation-debug-telemetry';

    this.root.append(
      control('Hero', this.hero),
      control('Animation clip', this.clip),
      control('Pause', this.pause),
      control('Playback speed', this.speed),
      control('Loop', this.loop),
      control('Scrub', this.scrub),
      control('Facing', this.facing),
      this.restart,
      this.release,
      this.telemetry
    );
    document.querySelector('.game-wrap')?.append(this.root);
    this.hero.addEventListener('change', () => {
      this.populateClips();
      this.onHeroRequested(this.hero.value);
      this.apply(true);
    });
    this.clip.addEventListener('change', () => this.apply(true));
    this.pause.addEventListener('change', () => this.apply(false));
    this.speed.addEventListener('input', () => this.apply(false));
    this.loop.addEventListener('change', () => this.apply(false));
    this.scrub.addEventListener('input', () => {
      this.pause.checked = true;
      this.apply(false);
    });
    this.facing.addEventListener('change', () => this.apply(false));
    this.restart.addEventListener('click', () => this.apply(true));
    this.release.addEventListener('click', () => {
      this.renderer.clearAnimationDebugOverride();
      this.root.dataset.active = 'false';
      this.telemetry.textContent =
        'Gameplay control active.\nThe numeric semantic-pose runtime follows the controller; fixed clips remain available above for isolated rig inspection.';
    });
    this.populateClips();
    if (startInGameplay) {
      this.renderer.clearAnimationDebugOverride();
      this.root.dataset.active = 'false';
    } else {
      this.apply(true);
    }
  }

  populateClips() {
    this.clip.replaceChildren();
    for (const clip of IMPORTED_CHARACTER_ANIMATIONS[this.hero.value].clips) {
      this.clip.append(option(clip.id, clip.label));
    }
  }

  apply(restart) {
    this.root.dataset.active = 'true';
    this.renderer.setAnimationDebugOverride({
      hero: this.hero.value,
      clipId: this.clip.value,
      paused: this.pause.checked,
      speed: Number(this.speed.value),
      loop: this.loop.checked,
      normalizedTime: Number(this.scrub.value),
      facing: Number(this.facing.value),
      restart
    });
  }

  update() {
    const gameplay = this.getGameplaySnapshot();
    const animation = this.renderer.getAnimationDebugSnapshot();
    const live = this.renderer.getLiveAnimationTelemetry(gameplay?.hero);
    if (!gameplay) return;
    if (!animation) {
      const lines = [
        'Gameplay control active.',
        `state      ${gameplay.movementState}`,
        `velocity   ${gameplay.velocityX.toFixed(3)}, ${gameplay.velocityY.toFixed(3)}`,
        `grounded   ${gameplay.grounded}`
      ];
      if (live) {
        lines.push(
          `subphase   ${live.presentationSubphase}`,
          `pose       ${live.selectedPoseState}`,
          `phase      ${live.locomotionPhase.toFixed(4)}`,
          `contacts   L:${live.leftFootContact} R:${live.rightFootContact}`,
          `foot slip  ${live.measuredFootSlipPercentHeight.toFixed(3)}% H`,
          `penetrate  ${live.verticalPenetrationPercentHeight.toFixed(3)}% H`,
          `ground ETA ${Number.isFinite(live.predictedGroundSeconds)
            ? `${live.predictedGroundSeconds.toFixed(3)}s`
            : '—'}`,
          `blend      ${live.blendSeconds.toFixed(4)}s`,
          `flip mark  ${live.facingFlipMarker}`,
          `rig limit  ${live.rigLimitedStatus.join(', ')}`
        );
      }
      if (gameplay.recentEvents?.length) {
        lines.push(
          `events     ${gameplay.recentEvents
            .slice(-8)
            .map(event => event.type)
            .join(' · ')}`
        );
      }
      this.telemetry.textContent = lines.join('\n');
      return;
    }
    if (!this.pause.checked && animation.durationSeconds > 0) {
      this.scrub.value = String(animation.timeSeconds / animation.durationSeconds % 1);
    }
    const root = animation.skeletonRootWorld;
    this.telemetry.textContent = [
      `clip       ${animation.clipId}`,
      `state      ${gameplay.movementState}`,
      `velocity   ${gameplay.velocityX.toFixed(3)}, ${gameplay.velocityY.toFixed(3)}`,
      `grounded   ${gameplay.grounded}`,
      `root       ${root.x.toFixed(2)}, ${root.y.toFixed(2)}, ${root.z.toFixed(2)}`,
      `facing     ${animation.facing < 0 ? 'left' : 'right'}`,
      `time       ${animation.timeSeconds.toFixed(3)} / ${animation.durationSeconds.toFixed(3)}`,
      `speed      ${animation.speed.toFixed(2)}×`,
      `loop       ${animation.loop}`
    ].join('\n');
  }
}
