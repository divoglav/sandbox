import { onMount } from "solid-js";
import { Godfather } from "../../draws/complete/godfather/godfather";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new Godfather(canvasRef).init();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
