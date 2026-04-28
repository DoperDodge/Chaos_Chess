import Phaser from 'phaser';
import { BoardScene } from './BoardScene.js';

export function mountPhaser(container, hooks) {
  const width = 720;
  const height = 720;
  const config = {
    type: Phaser.AUTO,
    parent: container,
    width,
    height,
    backgroundColor: '#0d0a1f',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BoardScene],
  };
  const game = new Phaser.Game(config);
  game.scene.start('BoardScene', { hooks });
  return {
    updateState: (state, myColor) => {
      const scene = game.scene.getScene('BoardScene');
      if (scene?.applyState) scene.applyState(state, myColor);
    },
    playEvents: (events) => {
      const scene = game.scene.getScene('BoardScene');
      if (scene?.playEvents) scene.playEvents(events);
    },
    destroy: () => game.destroy(true),
  };
}
