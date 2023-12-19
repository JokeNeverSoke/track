import { TypeError } from "./typecheck.ts";
import { bold, gray, red } from "https://deno.land/std@0.209.0/fmt/colors.ts";

const SINGLE_LINE_CONTEXT = 2; // two lines above and below
const MULTI_LINE_CONTEXT = 1; // one line above and below

export function fmtError(error: TypeError, source: string): string {
  const { range: { start, end }, message } = error;
  const lines = source.split("\n");

  const padding = " ".repeat(2);
  const lineNumWidth = lines.length.toString().length;
  function line(lineNum: number, emphasis = false) {
    const lineNumStr = lineNum.toString().padStart(lineNumWidth, " ");
    const line = lines[lineNum - 1];
    const lineStr = `${padding}${bold(lineNumStr)} ${
      emphasis ? red(">") : "|"
    } ${line}`;
    return lineStr;
  }

  const messageLine = `  ${bold(red("error"))}: ${message}`;

  let codeLines;
  if (end.line - start.line === 0) {
    const linesAbove = Math.min(start.line - 1, SINGLE_LINE_CONTEXT);
    const linesBelow = Math.min(lines.length - end.line, SINGLE_LINE_CONTEXT);
    codeLines = [
      ...Array(linesAbove).fill(0).map((_, i) =>
        line(start.line - linesAbove + i)
      ),
      line(start.line),
      `${padding}  ${" ".repeat(start.column + lineNumWidth)}${
        red("^").repeat(end.column - start.column + 1)
      }`,
      ...Array(linesBelow).fill(0).map((_, i) => line(end.line + i + 1)),
    ];
  } else {
    const linesAbove = Math.min(start.line - 1, MULTI_LINE_CONTEXT);
    const linesBelow = Math.min(lines.length - end.line, MULTI_LINE_CONTEXT);
    codeLines = [
      // context above
      ...Array(linesAbove).fill(0).map((_, i) =>
        line(start.line - linesAbove + i)
      ),
      // actual lines (start to end)

      ...Array(end.line - start.line + 1).fill(0).map((_, i) =>
        line(start.line + i, true)
      ),

      // lines below
      ...Array(linesBelow).fill(0).map((_, i) => line(end.line + i + 1)),
    ];
  }

  return [messageLine, ...codeLines, ""].join("\n");
}
