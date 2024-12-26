import { onMount } from "solid-js";
import { Godfather } from "../../draws/complete/godfather/godfather";
import { Regeneration } from "../../draws/complete/regeneration/regeneration";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new Regeneration(canvasRef).init();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
