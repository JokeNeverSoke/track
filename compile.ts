import * as AST from "./main.ts";

/** intermediate representation to allow indentation */
type PartialCode = string;
export interface CompileOptions {
  indent?: number | "tab";
}

const typeToString = (type: AST.TypeAnnotation): string => {
  if (type.type === "type-function") {
    switch (type.name) {
      case "List-of":
        return `(Listof Any)`; // TODO
      case "Any":
        return "any";
    }
  } else if (type.type === "type-literal") {
    return type.name.value;
  } else {
    throw new Error(`Unknown type: ${type}`);
  }
};

export function compile(ast: AST.Program, opts: CompileOptions = {
  indent: 2,
}): string {
  const indent = opts.indent === "tab" ? "\t" : " ".repeat(opts.indent ?? 2);
  function partial(code: Array<string>, layer = 0): PartialCode {
    return code.map((code) => indent.repeat(layer) + code).join("\n");
  }
  function layer(code: string, layer = 1) {
    return code.split("\n").map((line) => indent.repeat(layer) + line).join(
      "\n",
    );
  }
  const partials = [];

  for (const expr of ast) {
    partials.push(compileExpr(expr));
  }
  function compileExpr(expr: AST.Expr): PartialCode | string {
    switch (expr.type) {
      case "define-constant":
        return compileDefineConstant(expr);
      case "define-function":
        return compileDefineFunction(expr);
      case "if-statement":
        return compileIfStatement(expr);
      case "define-struct":
        return compileDefineStruct(expr);
      case "cond-statement":
        return compileCondStatement(expr);
      case "lambda-statement":
        return compileLambdaStatement(expr);
      case "local-statement":
        return compileLocalStatement(expr);
      case "let-statement":
        return compileLetStatement(expr);
      case "letrec-statement":
        return compileLetrecStatement(expr);
      case "letstar-statement":
        return compileLetstarStatement(expr);
      case "require-statement":
        return compileRequireStatement(expr);
      case "misc-function":
        return compileMiscFunction(expr);
      case "number-literal":
        return compileNumberLiteral(expr);
      case "number-exact":
        return compileNumberExact(expr);
      case "number-inexact":
        return compileNumberInexact(expr);
      case "string-literal":
        return compileStringLiteral(expr);
      case "boolean-literal":
        return compileBooleanLiteral(expr);
      case "identifier":
        return compileIdentifier(expr);
      case "symbol-value":
        return compileSymbolValue(expr);
      default:
        // @ts-ignore fallback case
        throw new Error(`Unknown expression type: ${expr.type}`);
    }
  }
  function compileDefineConstant(expr: AST.DefineConstant): PartialCode {
    return partial([
      "(define " + compileIdentifier(expr.name),
      layer(compileFunctionValue(expr.value) + ")"),
    ]);
  }
  function compileFunctionValue(expr: AST.FunctionValue): PartialCode | string {
    switch (expr.type) {
      case "if-statement":
        return compileIfStatement(expr);
      case "cond-statement":
        return compileCondStatement(expr);
      case "lambda-statement":
        return compileLambdaStatement(expr);
      case "local-statement":
        return compileLocalStatement(expr);
      case "let-statement":
        return compileLetStatement(expr);
      case "letrec-statement":
        return compileLetrecStatement(expr);
      case "letstar-statement":
        return compileLetstarStatement(expr);
      case "require-statement":
        return compileRequireStatement(expr);
      case "misc-function":
        return compileMiscFunction(expr);
      case "number-literal":
        return compileNumberLiteral(expr);
      case "number-exact":
        return compileNumberExact(expr);
      case "number-inexact":
        return compileNumberInexact(expr);
      case "string-literal":
        return compileStringLiteral(expr);
      case "boolean-literal":
        return compileBooleanLiteral(expr);
      case "identifier":
        return compileIdentifier(expr);
      case "symbol-value":
        return compileSymbolValue(expr);
    }
  }
  function compileDefineFunction(expr: AST.DefineFunction): PartialCode {
    return partial([
      `;; ${expr.name.value} : ${
        expr.signature.parameters.map((param) => {
          return expr.signature.type === "untyped-parameters"
            ? "any"
            : typeToString(param.type as AST.TypeAnnotation);
        }).join(" ")
      } -> ${
        expr.signature.type === "untyped-parameters" ||
          expr.signature.returnType === null
          ? "any"
          : typeToString(expr.signature.returnType)
      }`,
      "(define (" + compileIdentifier(expr.name) + " " +
      compileFunctionSignature(expr.signature) + ")",
      layer(compileFunctionValue(expr.body)) + ")",
    ]);
  }
  function compileFunctionSignature(expr: AST.FunctionSignature): string {
    switch (expr.type) {
      case "typed-parameters":
        return compileTypedParameters(expr);
      case "untyped-parameters":
        return compileUntypedParameters(expr);
    }
  }
  function compileTypedParameters(expr: AST.TypedParameters): string {
    return expr.parameters.map(({ name }) => compileIdentifier(name)).join(" ");
  }
  function compileUntypedParameters(expr: AST.UntypedParameters): string {
    return expr.parameters.map((name) => compileIdentifier(name)).join(" ");
  }
  function compileIfStatement(expr: AST.IfStatement): PartialCode {
    return partial([
      "(if " + compileExpr(expr.condition),
      layer(compileExpr(expr.then)),
      layer(compileExpr(expr.else)) + ")",
    ]);
  }
  function compileDefineStruct(expr: AST.DefineStruct): PartialCode {
    return partial([
      "(define-struct " + compileIdentifier(expr.name) +
      " (" + compileFunctionSignature(expr.fields) + "))",
    ]);
  }
  function compileCondStatement(expr: AST.CondStatement): PartialCode {
    return partial([
      "(cond",
      layer(compileCondClauseList(expr.clauses)) + ")",
    ]);
  }
  function compileCondClauseList(expr: AST.CondClauseList): PartialCode {
    return partial(expr.clauses.map(compileCondClause));
  }
  function compileCondClause(expr: AST.CondClause): PartialCode {
    return partial([
      "(" + compileExpr(expr.condition),
      layer(compileExpr(expr.then)) + ")",
    ]);
  }
  function compileLambdaStatement(expr: AST.LambdaStatement): PartialCode {
    return partial([
      "(lambda (" + compileFunctionSignature(expr.parameters) + ")",
      layer(compileExpr(expr.body)) + ")",
    ]);
  }
  function compileLocalStatement(expr: AST.LocalStatement): PartialCode {
    const locals = expr.definitions.map((def) =>
      layer(compileDefineStatement(def))
    );
    return partial([
      "(local (",
      ...locals.slice(0, -1),
      locals[locals.length - 1] + ")",
      layer(compileExpr(expr.body)) + ")",
    ]);
  }
  function compileDefineStatement(expr: AST.Define): PartialCode {
    switch (expr.type) {
      case "define-function":
        return compileDefineFunction(expr);
      case "define-constant":
        return compileDefineConstant(expr);
    }
  }
  function compileLetStatement(expr: AST.LetStatement): PartialCode {
    return partial([
      "(let (",
      ...expr.definitions.map((binding) => layer(compileValuePair(binding))),
      layer(compileExpr(expr.body)) + ")",
    ]);
  }
  function compileLetrecStatement(expr: AST.LetRecStatement): PartialCode {
    return partial([
      "(letrec (",
      ...expr.definitions.map((binding) => layer(compileValuePair(binding))),
      layer(compileExpr(expr.body)) + ")",
    ]);
  }
  function compileLetstarStatement(expr: AST.LetStarStatement): PartialCode {
    return partial([
      "(let* (",
      ...expr.definitions.map((binding) => layer(compileValuePair(binding))),
      layer(compileExpr(expr.body)) + ")",
    ]);
  }
  function compileValuePair(expr: AST.ValuePair): PartialCode {
    return partial([
      "(" + compileIdentifier(expr.name),
      layer(compileExpr(expr.value)) + ")",
    ]);
  }
  function compileRequireStatement(expr: AST.RequireStatement): PartialCode {
    return partial([
      "(require " + compileExpr(expr.module) + ")",
    ]);
  }
  function compileMiscFunction(expr: AST.MiscFunction): PartialCode {
    return partial([
      "(" + compileIdentifier(expr.name),
      ...expr.arguments.map((arg) => layer(compileExpr(arg))),
      ")",
    ]);
  }
  function compileNumberLiteral(expr: AST.NumberLiteral): string {
    return expr.value.toString();
  }
  function compileNumberExact(expr: AST.NumberExact): string {
    return `${expr.numerator}/${expr.denominator}`;
  }
  function compileNumberInexact(expr: AST.NumberInexact): string {
    return expr.value.toString();
  }
  function compileStringLiteral(expr: AST.StringLiteral): string {
    return JSON.stringify(expr.value);
  }
  function compileBooleanLiteral(expr: AST.BooleanLiteral): string {
    return expr.value ? "#true" : "#false";
  }
  function compileIdentifier(expr: AST.Identifier): string {
    return expr.value;
  }
  function compileSymbolValue(expr: AST.SymbolValue): string {
    return expr.value;
  }
  return "#lang htdp/isl+\n" + partials.join("\n");
}
