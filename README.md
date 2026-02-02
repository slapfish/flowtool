# flowtool

A visual design tool for planning application business logic. You drag and drop logical units—data fetching, transformation, decision points, AI calls—connect them to show flow, and define inputs/outputs for each step. The output
   is a machine-readable spec that you feed to Claude Code or Cursor, which then implements exactly what you designed.

  The problem it solves is that AI coding assistants are bad at architecture. You describe something in chat, they make assumptions, build the wrong structure, then waste time fixing it while orphaning good ideas along the way.
  "Planning mode" is just more chat—you can't verify alignment until you see the code. A visual tool lets you catch misalignment before implementation: wrong flow, unnecessary steps, missing logic. You see it, you fix it, then you
  hand off.

  The deeper value is encoding hard-won knowledge about how to make AI agents actually work. Accurate prompts are incredibly difficult, and it's nearly impossible to tell if you've improved one or made it worse without running it.
  Structured output schemas can make or break functionality—something as simple as adding a "passed" flag can be the difference between an agent returning garbage or correctly filtering results. It seems arbitrary, but the right
  schema focuses the AI's "logic" in a more deterministic way. And complex tasks need to be decomposed for cheaper models to handle them reliably. The tool bakes in these patterns: prompt templates that work, schema designs that
  guide the AI, and task breakdowns that let you use nano where others waste money on opus.
