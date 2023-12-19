import { parseArgs } from "https://deno.land/std@0.209.0/cli/mod.ts";

const { _, ...args } = parseArgs(Deno.args, {
  string: ["_", "out"],
  alias: { "out": ["-o", "--out"] },
});

const [command, file, ...rest] = _;
const out = args.out ?? "compiled.rkt";

// commands: compile, check

switch (command) {
  case "compile": {
    const { tokenize, parse } = await import("./main.ts");
    const { compile } = await import("./compile.ts");
    const source = await Deno.readTextFile(file);
    const tokens = tokenize(source);
    const ast = parse(tokens);
    const compiled = compile(ast);
    await Deno.writeTextFile(out, compiled);
    break;
  }
  case "check": {
    const { tokenize, parse } = await import("./main.ts");
    const { typecheck } = await import("./typecheck.ts");
    const source = await Deno.readTextFile(file);
    const tokens = tokenize(source);

    console.log(tokens);
    const ast = parse(tokens);
    const errors = typecheck(ast);
    if (errors.length > 0) {
      console.error(errors);
      Deno.exit(1);
    }
    break;
  }
  default:
    console.error(`Unknown command: ${command}`);
    Deno.exit(1);
}
