import { onMount } from "solid-js";
import { Sand } from "../../draws/sand/sand";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new Sand(canvasRef).init();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
