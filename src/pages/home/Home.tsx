import { onMount } from "solid-js";
import { Fields } from "../../draws/fields/fields";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new Fields(canvasRef).init();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
