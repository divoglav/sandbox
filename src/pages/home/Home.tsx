import { onMount } from "solid-js";
import { ParticleTexture } from "../../draws/particle-texture/particle-texture";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new ParticleTexture(canvasRef).setup();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
