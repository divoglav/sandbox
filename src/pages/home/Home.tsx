import { onMount } from "solid-js";
import { Particles } from "../../draws/particles/particles";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new Particles(canvasRef).setup();
  });


  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
