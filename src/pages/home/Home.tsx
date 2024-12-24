import { onMount } from "solid-js";
import { TenThousand } from "../../draws/complete/tenthousand/tenthousand";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new TenThousand(canvasRef).init();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
