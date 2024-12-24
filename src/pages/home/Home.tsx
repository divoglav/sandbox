import { onMount } from "solid-js";
import { ParticlesFeedback } from "../../draws/archive/particles-feedback/particles-feedback";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new ParticlesFeedback(canvasRef).setup();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
