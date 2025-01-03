import { onMount } from "solid-js";
import { BlockCellularAutomata } from "../../draws/complete/block-cellular-automata/block-cellular-automata";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new BlockCellularAutomata(canvasRef).init();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
