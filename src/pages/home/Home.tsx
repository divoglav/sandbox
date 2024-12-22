import { onMount } from "solid-js";
import { ParticleTexture } from "../../draws/particle-texture/particle-texture";
import { Minimal } from "../../draws/template/minimal/minimal";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new Minimal(canvasRef).setup();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
