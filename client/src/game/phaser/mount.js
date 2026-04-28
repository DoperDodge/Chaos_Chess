import Phaser from 'phaser';
import { BoardScene } from './BoardScene.js';

export function mountPhaser(container, hooks) {
  const width = 720;
  const height = 720;
  // Shared mutable handed to the scene via init(). The React layer can write
  // to this object at any moment; the scene reads it during create() so an
  // initial state push that arrives before Phaser has booted is never lost.
  const shared = {
    hooks,
    state: null,
    myColor: 'white',
    pendingEvents: [],
  };
  const config = {
    type: Phaser.AUTO,
    parent: container,
    width,
    height,
    backgroundColor: '#0d0a1f',
    pixelArt: false,           // chess glyphs need anti-aliasing to render legibly
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BoardScene],
  };
  const game = new Phaser.Game(config);
  game.scene.start('BoardScene', { shared });
  return {
    updateState: (state, myColor) => {
      shared.state = state;
      if (myColor) shared.myColor = myColor;
      const scene = game.scene.getScene('BoardScene');
      if (scene?.created) scene.applyState(state, myColor);
    },
    playEvents: (events) => {
      if (!events?.length) return;
      const scene = game.scene.getScene('BoardScene');
      if (scene?.created) scene.playEvents(events);
      else shared.pendingEvents.push(...events);
    },
    destroy: () => game.destroy(true),
  };
}
