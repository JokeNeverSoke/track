import { inspect } from "node:util";
import { parseArgs } from "https://deno.land/std@0.209.0/cli/mod.ts";
import { parse, tokenize } from "./parser.ts";
import { compile } from "./compile.ts";
import { typecheck } from "./typecheck.ts";
import { fmtError } from "./fmtErrors.ts";
import {
  bgGreen,
  bold,
  gray,
  italic,
  underline,
  white,
} from "https://deno.land/std@0.208.0/fmt/colors.ts";

const { _, ...args } = parseArgs(Deno.args, {
  string: ["_", "--out"],
  boolean: [
    "--no-emit",
    "--no-check",
  ],
  alias: {},
});

const [file, ...rest] = _;
const out = args["--out"] ?? "out.rkt";

if (!file) {
  console.log(`\
T(yped)Rack(et) ${underline("v0.0.1")}
${italic("Makes Racket slightly better. Only slightly.")}

${bold("USAGE:")}
  \$ trc [options] <file>

${bold("ARGUMENTS:")}
  <file>        The file to compile

${bold("OPTIONS:")}
  --out=<file>  The output file (default: out.rkt)
  --no-emit     Do not emit the compiled code (only typecheck)
  --no-check    Skips typechecking (may fail to compile)

${bold("EXAMPLE:")}
  \$ trc --out=main.rkt main.trkt

${bold("REPOSITORY:")}
  <${underline("https://github.com/jokeneversoke/track")}>

${bold("AUTHOR:")}
  Joseph Zeng   <${underline("jokeneversoke@gmail.com")}>

${bold("LICENSE:")}
  ${bold("GPLv3")}, see <${
    underline("https://github.com/JokeNeverSoke/track/blob/master/LICENSE")
  }>
  for details. No warranties provided.
`);
  Deno.exit(1);
}
const source = await Deno.readTextFile(file);
const tokens = tokenize(source);
const ast = parse(tokens);
if (!args["no-check"]) {
  const errors = typecheck(ast).sort((a, b) => {
    const { range: { start: aStart } } = a;
    const { range: { start: bStart } } = b;
    if (aStart.line === bStart.line) {
      return aStart.column - bStart.column;
    }
    return aStart.line - bStart.line;
  });
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(fmtError(error, source));
    }

    console.error(
      `Found ${errors.length} error${
        errors.length === 1 ? "" : "s"
      }, skipping emit. ` + italic(gray("(--no-check to override)")),
    );
    Deno.exit(1);
  } else {
    console.log(bgGreen(white("√")) + " No errors, building...");
  }
}

if (!args["no-emit"]) {
  const compiled = compile(ast);
  await Deno.writeTextFile(out, compiled);
  console.log(`Wrote to ${out}`);
}
