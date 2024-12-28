# Sand

## Multi Pass

To avoid conflicts like:

```
[Sand]
[Empty]
[Gas]
```

I can use multiple passes per frame:

First: move gas
Second: move sand

## Claims

A common way is to use two textures (in addition to your main state) or extra channels in a ping-pong setup—one for “claims” and one for “who’s been claimed.” For instance:

    Pass 1 (“Claim”):
        Your shader still runs over every cell.
        If this cell is empty, it looks at neighbors in the old state texture. If it finds a sand neighbor, it decides to claim that neighbor.
        In the output of Pass 1 (a “claim texture”), each cell writes:
            Who (if anyone) it wants to claim sand from (e.g., an integer or offset).
            A tie-break priority if needed (e.g., random, or by coordinates).
        The neighbor itself isn’t directly modified, because in a fragment shader you can only write to the current cell’s output.

    Pass 1 (“Mark claimed”):
        Often you do this in the same pass or a separate sub-pass.
        You also output a second texture (or an additional channel) that marks each sand cell as “claimed” or not, possibly storing the winning claim’s priority.
        How? Each fragment can look at the claims of its neighbors in the claim texture (the “would-be claimers”). If there are multiple claimers, choose one. Then you mark yourself as “claimed by cell X.”

    Pass 2 (“Resolve”):
        Now that you know exactly which sand cells got claimed, you do another full-screen pass:
            If a sand cell was claimed, it becomes empty.
            The empty cell that claimed it becomes sand.
        This pass reads both the old state (to see the original material) and the “claims” or “claimed” texture from Pass 1 to finalize changes.

This sounds complicated, but the essential idea is:

    Pass 1: Collect claims from empty cells and figure out which sand cells are successfully claimed (tie-break if multiple claims).
    Pass 2: Apply those claims to produce the new state.

Why Not Just One Texture?

Because in WebGL2 fragment shaders you can’t directly write to arbitrary neighbor cells. Each fragment can only write to its own location in the output. So you need an intermediate scheme:

    Empty cell outputs “I want to pull from neighbor N.”
    Neighbor N sees all incoming “I want to pull you” claims and decides who (if anyone) gets the sand.
    A second pass applies the results.

That’s the most direct GPU-side approach to do true multi-cell “push/pull” with no duplication, all in WebGL2. Some people do simpler single-pass approaches (checkerboard, random updates) to avoid the complexity, but multi-pass with explicit claiming is how you fully solve duplication and conflicts.

## The Problem

Claims can solve the left-right thing, but what about this scenario:

Empty cell claims Water cell.
Water cell claims Sand cell.

This is a chained interaction.

## My Solution..?

Combine multi pass with claims.

Something like:

1. Empty claims.
2. Empty swaps.
3. Water claims.
4. Water swaps.
