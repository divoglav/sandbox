import { onMount } from "solid-js";
import { Sandfall } from "../../draws/sandfall/sandfall";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new Sandfall(canvasRef).init();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
