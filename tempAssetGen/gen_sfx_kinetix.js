const fs = require('fs');
const path = require('path');

const ENGINE = 'C:/Users/LOUJAN B/.gemini/config/plugins/ls-clad/skills/build-sfx/tools';
const audio = require(ENGINE);
const p = audio.sfx_presets;

const PROJECT_ASSETS_SFX = 'C:/Users/LOUJAN B/Kinetix-Twin/Kinetix-Twin-SPECS/Assets/GeneratedSFX';
fs.mkdirSync(PROJECT_ASSETS_SFX, { recursive: true });

// 1. UI Click: crisp glass/mechanical tactile button click
{
    const clickBuf = p.uiClick({ character: 'sharp', pitch: 2 });
    audio.mix_bus.masterChain(clickBuf, { normalize: 'peak' });
    audio.WavBuilder.write(clickBuf, path.join(PROJECT_ASSETS_SFX, 'ui_click.wav'));
}

// 2. Launch Thud: physical striker impact + low table resonance
{
    const impactBuf = p.impact({ material: 'wood', size: 'medium' });
    const blipBuf = p.uiBlip({ pitch: -3 });
    const len = Math.max(impactBuf.length, blipBuf.length);
    const out = new Float32Array(len);
    audio.addInto(out, impactBuf, 0, 0.9);
    audio.addInto(out, blipBuf, 0, 0.35);
    audio.fadeOut(out, 0.01);
    audio.mix_bus.masterChain(out, { normalize: 'peak' });
    audio.WavBuilder.write(out, path.join(PROJECT_ASSETS_SFX, 'launch_thud.wav'));
}

// 3. Slide Hum: 1.45s smooth tabletop friction glide
{
    const dur = 1.45;
    const noise = audio.whiteNoise(dur, 0.4);
    audio.lowPassSweep(noise, 950, 220, dur, 'exponential');
    const tone = audio.sweep(180, 75, dur, 'sine', 'exponential');
    const sum = audio.mix([noise, tone], [0.55, 0.35]);
    audio.humanize.ampWobble(sum, 6.0, 0.12);
    audio.adsrExp(sum, 0.03, 0.25, 0.6, 0.35, 2);
    audio.fadeOut(sum, 0.02);
    const processed = audio.mix_bus.applyFx(sum, { hpf: 90, lpf: 1400, gain: 0.75 });
    audio.mix_bus.masterChain(processed, { normalize: 'peak' });
    audio.WavBuilder.write(processed, path.join(PROJECT_ASSETS_SFX, 'slide_hum.wav'));
}

// 4. Spin Whoosh: rotational air-whoosh + confirmation harmonic on stop
{
    const swishBuf = p.whoosh({ duration: 0.55, size: 'medium', direction: 'by' });
    audio.mix_bus.masterChain(swishBuf, { normalize: 'peak' });
    audio.WavBuilder.write(swishBuf, path.join(PROJECT_ASSETS_SFX, 'spin_whoosh.wav'));
}

console.log('Generated all 4 Kinetix Twin SFX WAV files successfully.');
