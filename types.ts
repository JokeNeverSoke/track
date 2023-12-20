import * as AST from "./parser.ts";
export type Range = {
  start: AST.Position;
  end: AST.Position;
};
export type TypeError = {
  message: string;
  range: Range;
  supplements?: { range: Range; annotation: string }[];
};
export type CodeType = {
  type: "number" | "string" | "boolean" | "symbol";
} | {
  type: "list";
  subtype: CodeType;
} | {
  type: "function";
  args: Array<CodeType & { expandable?: boolean }>;
  ret: CodeType;
} | {
  type: "struct";
  name: string;
} | {
  // flexible does not raise errors, while any does
  type: "flexible" | "any" | "void";
} | {
  type: "union";
  types: CodeType[];
};

export type LanguageEnvironment = Record<string, CodeType>;
