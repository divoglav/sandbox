import { onMount } from "solid-js";
import { Layers } from "../../draws/archive/layers/layers";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new Layers(canvasRef).setup();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
