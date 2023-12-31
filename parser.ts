/*
#lang htdp/isl+

;; this line is not included without ;;@
;;@ adds three numbers and return the sum
;;@ works for any three numbers
(define (f x : Number & y : Number & z : Number -> Number)
  (+ x y z))
  (f x y z)

;;; would compile to

;; f : Number Number Number -> Number
;; adds three numbers and return the sum
;; works for any three numbers
(define (f x y z)
  (+ x y z))

;;; If compiled with with-typeguard

;; f : Number Number Number -> Number
;; adds three numbers and return the sum
;; works for any three numbers
(define (f x y z)
  (cond
    [(not (number? x)) (error 'f "expects a Number as 1st argument, given ~e" x)]
    [(not (number? y)) (error 'f "expects a Number as 2nd argument, given ~e" y)]
    [(not (number? z)) (error 'f "expects a Number as 3rd argument, given ~e" z)]
    [else (+ x y z)]))
*/
export interface Position {
  line: number;
  column: number;
  index: number;
}
export type Token =
  & {
    position: {
      start: Position;
      end: Position;
    };
  }
  & (
    | (
      & { isTyped: false }
      & ({
        type:
          | "leftParen"
          | "rightParen"
          | "define"
          | "define-struct"
          | "if"
          | "cond"
          | "else"
          | "lambda"
          | "local"
          | "let"
          | "letrec"
          | "let*"
          | "require";
      } | {
        type: "number-literal";
        value: number;
      } | {
        type: "number-exact";
        numerator: number;
        denominator: number;
      } | {
        type: "number-inexact";
        value: number;
      } | {
        type: "string";
        value: string;
      } | {
        type: "boolean";
        value: boolean;
      } | {
        type: "identifier";
        value: string;
      } | {
        type: "symbol";
        value: string;
      })
    )
    | (
      & { isTyped: true }
      & ({
        // typed racket addons
        type: "t-is" | "t-and" | "t-produce";
      } | {
        type: "t-define-docstring";
        value: string;
      })
    )
  );

const EXTRA_ID_CHARS = ["-", "_", "?", "!", "=", "<", ">", "+", "*", "/"];

function isDigit(char: string) {
  return char >= "0" && char <= "9";
}
function isWhitespace(char: string) {
  return char === " " || char === "\n" || char === "\t";
}
function isAlpha(char: string) {
  return char >= "a" && char <= "z" || char >= "A" && char <= "Z";
}
function isAlphaNumeric(char: string) {
  return isAlpha(char) || isDigit(char);
}
function isIdentifierStart(char: string) {
  return isAlpha(char) || EXTRA_ID_CHARS.includes(char);
}
function isIdentifier(char: string) {
  return isAlphaNumeric(char) ||
    EXTRA_ID_CHARS.includes(char);
}

export function tokenize(code: string) {
  const tokens: Token[] = [];
  let current = 0;
  let line = 1;
  let column = 0;
  let start: { line: number; column: number; index: number };

  function reStart() {
    start = {
      line,
      column,
      index: current - 1,
    };
  }

  function advance() {
    current++;
    column++;
    if (code[current-1] === "\n") {
      line++;
      column = 0;
    }
    return code[current - 1];
  }
  function match(expected: string) {
    if (isAtEnd()) return false;
    if (code[current] !== expected) return false;

    current++;
    return true;
  }
  function matchLong(expected: string, dontAdvance = false) {
    if (isAtEnd()) return false;
    if (code.substring(current, current + expected.length) !== expected) {
      return false;
    }

    if (!dontAdvance) {
      current += expected.length;
    }
    return true;
  }
  function peek() {
    if (isAtEnd()) return "\0";
    return code[current];
  }
  function peekNext() {
    if (current + 1 >= code.length) return "\0";
    return code[current + 1];
  }
  function previous() {
    return code[current - 1];
  }
  function isAtEnd() {
    return current >= code.length;
  }

  function position() {
    return {
      position: {
        start,
        end: {
          line,
          column,
          index: current,
        },
      },
    };
  }
  function pushToken(token: Token) {
    tokens.push(token);
  }

  function string() {
    let value = "";
    while (!isAtEnd()) {
      const char = advance();

      if (char === "\\") {
        if (match('"')) {
          value += '"';
          continue;
        } else if (match("\\")) {
          value += "\\";
          continue;
        } else {
          throw new Error(`Expected escape character, got ${char}`);
        }
      }
      if (char === '"') {
        break;
      }
    }
    pushToken({ type: "string", value, isTyped: false, ...position() });
  }
  function comments() {
    if (matchLong(";@")) {
      advance();
      advance();
      let content = "";
      while (!isAtEnd()) {
        const char = advance();
        if (match("\n")) {
          break;
        }
        content += char;
      }
      pushToken({
        type: "t-define-docstring",
        value: content,
        isTyped: true,
        ...position(),
      });
    } else {
      while (!isAtEnd()) {
        const char = advance();
        if (match("\n")) {
          break;
        }
      }
    }
  }
  function symbol() {
    // take identifier
    let value = "";
    while (!isAtEnd()) {
      const char = code[current];

      if (isIdentifier(char)) {
        value += char;
        advance();
        continue;
      }
      break;
    }
    pushToken({ type: "symbol", value, isTyped: false, ...position() });
  }
  function number() {
    // a number can be a decimal, or a fraction
    // e.g. 1, 4.5, 2/3
    while (isDigit(peek())) advance();

    if (peek() === "." && isDigit(peekNext())) {
      advance();

      while (isDigit(peek())) advance();

      const value = parseFloat(code.substring(start.index, current));
      pushToken({
        type: "number-inexact",
        value,
        isTyped: false,
        ...position(),
      });
    } else if (peek() === "/" && isDigit(peekNext())) {
      advance();

      while (isDigit(peek())) advance();
      const value = code.substring(start.index, current);
      const parts = value.split("/");
      if (parts.length !== 2) {
        throw new Error(`Invalid fraction at line ${line}`);
      }
      const numerator = parseInt(parts[0]);
      const denominator = parseInt(parts[1]);
      pushToken({
        type: "number-exact",
        numerator,
        denominator,
        isTyped: false,
        ...position(),
      });
    } else {
      const value = parseInt(code.substring(start.index, current));
      pushToken({
        type: "number-literal",
        value,
        isTyped: false,
        ...position(),
      });
    }
  }
  function identifier() {
    let value = previous();
    while (!isAtEnd()) {
      const char = code[current];

      if (isIdentifier(char)) {
        value += char;
        advance();
        continue;
      }
      break;
    }
    // filter keywords
    const keywords = [
      "define",
      "define-struct",
      "if",
      "cond",
      "else",
      "lambda",
      "local",
      "let",
      "letrec",
      "let*",
      "require",
    ] as const;
    type Keyword = typeof keywords[number];
    if (keywords.includes(value as Keyword)) {
      pushToken({ type: value as Keyword, isTyped: false, ...position() });
    } else if (value === "true" || value === "false") {
      pushToken({
        type: "boolean",
        value: value === "true",
        isTyped: false,
        ...position(),
      });
    } else {
      pushToken({ type: "identifier", value, isTyped: false, ...position() });
    }
  }
  function multilineComment() {
    while (!isAtEnd() && !matchLong("#|")) {
      advance();
    }
    if (matchLong("#|")) {
      advance();
      advance();
    } else {
      throw new Error("Unterminated multiline comment");
    }
  }
  function boolean_() {
    // #true or #false
    if (matchLong("true")) {
      pushToken({
        type: "boolean",
        value: true,
        isTyped: false,
        ...position(),
      });
    } else if (
      matchLong("false")
    ) {
      pushToken({
        type: "boolean",
        value: false,
        isTyped: false,
        ...position(),
      });
    } else {
      throw new Error(`Invalid character after #`);
    }
  }

  while (!isAtEnd()) {
    const char = advance();
    reStart();

    if (isWhitespace(char)) {
      continue;
    }

    switch (char) {
      case "[":
      case "(":
        pushToken({ type: "leftParen", isTyped: false, ...position() });
        break;
      case "]":
      case ")":
        pushToken({ type: "rightParen", isTyped: false, ...position() });
        break;
      case '"':
        string();
        break;
      case ";":
        comments();
        break;
      case "'":
        symbol();
        break;
      case ":":
        pushToken({ type: "t-is", isTyped: true, ...position() });
        break;
      case "&":
        pushToken({ type: "t-and", isTyped: true, ...position() });
        break;
      case "-":
        if (match(">")) {
          pushToken({ type: "t-produce", isTyped: true, ...position() });
        } else {
          // continue
          identifier();
        }
        break;
      case "#":
        if (match("|")) {
          multilineComment();
        } else if (
          matchLong("true", true) || matchLong("false", true)
        ) {
          boolean_();
        } else {
          throw new Error(`Invalid character after #: ${char}`);
        }
        break;
      default:
        if (isDigit(char)) {
          number();
        } else if (isIdentifierStart(char)) {
          identifier();
        }
    }
  }

  return tokens;
}
/*

Program -> Expr+

Expr -> Define
  | DefineStruct
  | Function

Define -> "(" ( DefineFunction | DefineConstant ) ")"
DefineFunction -> "define" "(" FunctionSignature ")" Function
DefineConstant -> "define" Identifier Function

// Typed signature and untyped
FunctionSignature -> Identifier Parameters

Parameters -> TypedParameters | UntypedParameters

TypedParameters -> Identifier ":" TypeAnnotation ("&" Identifier ":" TypeAnnotation)* "->" TypeAnnotation

TypeAnnotation -> "(" TypeFunction TypeAnnotation+ ")"
    | TypeLiteral

TypeFunction -> "List-of" | "Any"
TypeLiteral -> Identifier

UntypedParameters -> Identifier+

DefineStruct -> "define-struct" Identifier "(" Parameters ")"

Function -> IfStatement
     | CondStatement
     | LambdaStatement
     | LocalStatement
     | LetStatement
     | LetRecStatement
     | LetStarStatement
     | RequireStatement
     | MiscFunction
     | Value

IfStatement -> "(" "if" Function Function Function ")"

CondStatement -> "(" "cond" CondClauseList ")"

CondClauseList -> CondClause+ [ "(" "else" Function ")" ]

CondClause -> "(" Function Function ")"

LambdaStatement -> "(" "lambda" "(" Parameters ")" Function ")"

LocalStatement -> "(" "local" "(" Define* ")" Function ")"

ValuePair -> "(" Identifier Function ")"

LetStatement -> "(" "let" "(" ValuePair+ ")" Function ")"

LetRecStatement -> "(" "letrec" "(" ValuePair+ ")" Function ")"

LetStarStatement -> "(" "let*" "(" ValuePair+ ")" Function ")"

RequireStatement -> "(" "require" Identifier ")"

MiscFunction -> "(" Identifier Function+ ")"

Value -> Number | String | Boolean | Identifier | Symbol

*/

export type Program = Expr[];
export type Expr =
  | Define
  | DefineStruct
  | FunctionValue;

export type Define =
  | DefineFunction
  | DefineConstant;

export type DefineFunction = WithLoc<{
  type: "define-function";
  name: Identifier;
  signature: FunctionSignature;
  body: FunctionValue;
}>;
export type DefineConstant = WithLoc<{
  type: "define-constant";
  name: Identifier;
  value: FunctionValue;
}>;
export type DefineStruct = WithLoc<{
  type: "define-struct";
  name: Identifier;
  fields: Parameters;
}>;
export type FunctionSignature = TypedParameters | UntypedParameters;
export type Parameters = TypedParameters | UntypedParameters;
export type TypedParameters = WithLoc<{
  type: "typed-parameters";
  parameters: {
    name: Identifier;
    type: TypeAnnotation;
  }[];
  returnType: TypeAnnotation | null;
}>;
export type TypeAnnotation = TypeFunction | TypeLiteral;
export type TypeFunction = WithLoc<{
  type: "type-function";
  name: "List-of" | "Any";
}>;
export type TypeLiteral = WithLoc<{
  type: "type-literal";
  name: Identifier;
}>;
export type UntypedParameters = WithLoc<{
  type: "untyped-parameters";
  parameters: Identifier[];
}>;
export type FunctionValue =
  | IfStatement
  | CondStatement
  | LambdaStatement
  | LocalStatement
  | LetStatement
  | LetRecStatement
  | LetStarStatement
  | RequireStatement
  | MiscFunction
  | Value;

export type IfStatement = WithLoc<{
  type: "if-statement";
  condition: FunctionValue;
  then: FunctionValue;
  else: FunctionValue;
}>;
export type CondStatement = WithLoc<{
  type: "cond-statement";
  clauses: CondClauseList;
}>;
export type CondClauseList = WithLoc<{
  type: "cond-clause-list";
  clauses: CondClause[];
  else: FunctionValue | null;
}>;
export type CondClause = WithLoc<{
  type: "cond-clause";
  condition: FunctionValue;
  then: FunctionValue;
}>;
export type LambdaStatement = WithLoc<{
  type: "lambda-statement";
  parameters: Parameters;
  body: FunctionValue;
}>;
export type LocalStatement = WithLoc<{
  type: "local-statement";
  definitions: Define[];
  body: FunctionValue;
}>;
export type LetStatement = WithLoc<{
  type: "let-statement";
  definitions: ValuePair[];
  body: FunctionValue;
}>;
export type LetRecStatement = WithLoc<{
  type: "letrec-statement";
  definitions: ValuePair[];
  body: FunctionValue;
}>;
export type LetStarStatement = WithLoc<{
  type: "letstar-statement";
  definitions: ValuePair[];
  body: FunctionValue;
}>;
export type ValuePair = WithLoc<{
  type: "value-pair";
  name: Identifier;
  value: FunctionValue;
}>;
export type RequireStatement = WithLoc<{
  type: "require-statement";
  module: Identifier;
}>;
export type MiscFunction = WithLoc<{
  type: "misc-function";
  func: FunctionValue;
  arguments: FunctionValue[];
}>;
export type Value =
  | NumberLiteral
  | NumberExact
  | NumberInexact
  | StringLiteral
  | BooleanLiteral
  | Identifier
  | SymbolValue;
export type NumberLiteral = WithLoc<{
  type: "number-literal";
  value: number;
}>;
export type NumberExact = WithLoc<{
  type: "number-exact";
  numerator: number;
  denominator: number;
}>;
export type NumberInexact = WithLoc<{
  type: "number-inexact";
  value: number;
}>;
export type StringLiteral = WithLoc<{
  type: "string-literal";
  value: string;
}>;
export type BooleanLiteral = WithLoc<{
  type: "boolean-literal";
  value: boolean;
}>;
export type Identifier = WithLoc<{
  type: "identifier";
  value: string;
}>;
export type SymbolValue = WithLoc<{
  type: "symbol-value";
  value: string;
}>;

export type WithLoc<T> = T & {
  position: {
    start: Position;
    end: Position;
  };
};

export function parse(tokens: Token[]) {
  let current = 0;

  function advance() {
    current++;
    return tokens[current - 1];
  }
  function peek() {
    return tokens[current];
  }
  function peekNext() {
    return tokens[current + 1];
  }
  function isAtEnd() {
    return current >= tokens.length;
  }
  function previous() {
    return tokens[current - 1];
  }
  function consume<T extends Token["type"]>(
    type: T,
    message: string,
  ): Extract<Token, { type: T }> extends never ? Token
    : Extract<Token, { type: T }> {
    if (check(type)) {
      return advance() as Extract<Token, { type: T }>;
    }
    const pos = peek().position.start;

    throw new Error(
      message +
        ` at position ${pos.line}:${pos.column}, token ${current}, got ${peek().type}`,
    );
  }
  function check(type: Token["type"]) {
    if (isAtEnd()) return false;
    return peek().type === type;
  }
  function checkNext(type: Token["type"]) {
    if (isAtEnd()) return false;
    return peekNext()?.type === type;
  }

  function program() {
    const program: Program = [];
    while (!isAtEnd()) {
      program.push(expr());
    }
    return program;
  }
  function expr(): Expr {
    if (checkNext("define")) {
      return define();
    } else if (checkNext("define-struct")) {
      return defineStruct();
    } else {
      return functionValue();
    }
  }
  function define(): Define {
    const { start } = consume("leftParen", "Expected ( before define").position;
    consume("define", "Expected define");
    let d: WithLoc<Define>;
    if (check("leftParen")) {
      d = defineFunction();
    } else {
      d = defineConstant();
    }
    const { end } = consume("rightParen", "Expected ) after define").position;

    return { ...d, position: { start, end } };
  }
  function defineFunction(): DefineFunction {
    const { start } =
      consume("leftParen", "Expected ( before function signature").position;
    const name = identifier();
    const signature = functionSignature();
    consume("rightParen", "Expected ) after function signature");
    const body = functionValue();
    return {
      type: "define-function",
      name,
      signature,
      body,
      position: { start, end: body.position.end },
    };
  }
  function defineConstant(): DefineConstant {
    const name = identifier();
    const value = functionValue();
    return {
      type: "define-constant",
      name,
      value,
      position: { start: name.position.start, end: value.position.end },
    };
  }
  function defineStruct(): DefineStruct {
    const { start } =
      consume("leftParen", "Expected ( before define-struct").position;
    consume("define-struct", "Expected define-struct");
    const name = identifier();
    consume("leftParen", "Expected ( before struct fields");
    const fields = parameters();
    consume("rightParen", "Expected ) after struct fields");
    const { end } =
      consume("rightParen", "Expected ) after define-struct").position;
    return {
      type: "define-struct",
      name,
      fields,
      position: { start, end },
    };
  }
  function functionSignature(): FunctionSignature {
    const params = parameters();
    return params;
  }
  function parameters(): Parameters {
    if (checkNext("t-is")) {
      return typedParameters();
    } else {
      return untypedParameters();
    }
  }
  function typedParameters(): TypedParameters {
    const parameters: { name: Identifier; type: TypeAnnotation }[] = [];

    const name = identifier();
    consume("t-is", "Expected :");
    const type = typeAnnotation();
    parameters.push({ name, type });
    while (check("t-and")) {
      consume("t-and", "Expected &");
      const name = identifier();
      consume("t-is", "Expected :");
      const type = typeAnnotation();
      parameters.push({ name, type });
    }

    let returnType: TypeAnnotation | null = null;
    if (check("t-produce")) {
      consume("t-produce", "Expected ->");
      returnType = typeAnnotation();
    }

    return {
      type: "typed-parameters",
      parameters,
      returnType,
      position: {
        start: parameters[0].name.position.start,
        end: parameters[parameters.length - 1].type.position.end,
      },
    };
  }
  function typeAnnotation(): TypeAnnotation {
    if (check("leftParen")) {
      return typeFunction();
    } else {
      return typeLiteral();
    }
  }
  function typeFunction(): TypeFunction {
    const { start } =
      consume("leftParen", "Expected ( before type function").position;
    const name: Identifier = identifier();
    const { end } =
      consume("rightParen", "Expected ) after type function").position;
    return {
      type: "type-function" as const,
      name: name.value as "List-of" | "Any",
      position: { start, end },
    };
  }
  function typeLiteral(): TypeLiteral {
    const name = identifier();
    return {
      type: "type-literal",
      name,
      position: name.position,
    };
  }
  function untypedParameters(): UntypedParameters {
    const parameters: Identifier[] = [];
    while (!check("rightParen")) {
      parameters.push(identifier());
    }
    return {
      type: "untyped-parameters",
      parameters,
      position: {
        start: parameters[0].position.start,
        end: parameters[parameters.length - 1].position.end,
      },
    };
  }
  function functionValue(): FunctionValue {
    if (!check("leftParen")) {
      return value();
    }
    if (checkNext("if")) {
      return ifStatement();
    } else if (checkNext("cond")) {
      return condStatement();
    } else if (checkNext("lambda")) {
      return lambdaStatement();
    } else if (checkNext("local")) {
      return localStatement();
    } else if (checkNext("let")) {
      return letStatement();
    } else if (checkNext("letrec")) {
      return letRecStatement();
    } else if (checkNext("let*")) {
      return letStarStatement();
    } else if (checkNext("require")) {
      return requireStatement();
    } else {
      return miscFunction();
    }
  }
  function ifStatement(): IfStatement {
    const { start } =
      consume("leftParen", "Expected ( before if statement").position;
    consume("if", "Expected if");
    const condition = functionValue();
    const then = functionValue();
    console.log({ condition, then });
    const else_ = functionValue();
    const { end } =
      consume("rightParen", "Expected ) after if statement").position;
    return {
      type: "if-statement",
      condition,
      then,
      else: else_,
      position: { start, end },
    };
  }
  function condStatement(): CondStatement {
    const { start } =
      consume("leftParen", "Expected ( before cond statement").position;
    consume("cond", "Expected cond");
    const clauses = condClauseList();
    const { end } =
      consume("rightParen", "Expected ) after cond statement").position;
    return {
      type: "cond-statement",
      clauses,
      position: { start, end },
    };
  }
  function condClauseList(): CondClauseList {
    const clauses: CondClause[] = [];
    while (check("leftParen") && !checkNext("else")) {
      clauses.push(condClause());
    }
    let else_ = null;
    const { start } = clauses[0].position;
    let end = clauses[clauses.length - 1].position.end;
    if (checkNext("else")) {
      consume("leftParen", "Expected ( before else clause");
      consume("else", "Expected else");
      else_ = functionValue();
      end = consume("rightParen", "Expected ) after else clause").position.end;
    }
    return {
      type: "cond-clause-list",
      clauses,
      else: else_,
      position: { start, end },
    };
  }
  function condClause(): CondClause {
    const { start } =
      consume("leftParen", "Expected ( before cond clause").position;
    const condition = functionValue();
    const then = functionValue();
    const { end } =
      consume("rightParen", "Expected ) after cond clause").position;
    return {
      type: "cond-clause",
      condition,
      then,
      position: { start, end },
    };
  }
  function lambdaStatement(): LambdaStatement {
    const { start } =
      consume("leftParen", "Expected ( before lambda statement").position;
    consume("lambda", "Expected lambda");
    consume("leftParen", "Expected ( before parameters");
    const params = parameters();
    consume("rightParen", "Expected ) after parameters");
    const body = functionValue();
    const { end } =
      consume("rightParen", "Expected ) after lambda statement").position;
    return {
      type: "lambda-statement",
      parameters: params,
      body,
      position: { start, end },
    };
  }
  function localStatement(): LocalStatement {
    const { start } =
      consume("leftParen", "Expected ( before local statement").position;
    consume("local", "Expected local");
    consume("leftParen", "Expected ( before definitions");
    const definitions: Define[] = [];
    while (!check("rightParen")) {
      definitions.push(define());
    }
    consume("rightParen", "Expected ) after definitions");
    const body = functionValue();
    const { end } =
      consume("rightParen", "Expected ) after local statement").position;
    return {
      type: "local-statement",
      definitions,
      body,
      position: { start, end },
    };
  }
  function letStatement(): LetStatement {
    const { start } =
      consume("leftParen", "Expected ( before let statement").position;
    consume("let", "Expected let");
    consume("leftParen", "Expected ( before definitions");
    const definitions: ValuePair[] = [];
    while (!check("rightParen")) {
      definitions.push(valuePair());
    }
    consume("rightParen", "Expected ) after definitions");
    const body = functionValue();
    const { end } =
      consume("rightParen", "Expected ) after let statement").position;
    return {
      type: "let-statement",
      definitions,
      body,
      position: { start, end },
    };
  }
  function letRecStatement(): LetRecStatement {
    const { start } =
      consume("leftParen", "Expected ( before letrec statement").position;
    consume("letrec", "Expected letrec");
    consume("leftParen", "Expected ( before definitions");
    const definitions: ValuePair[] = [];
    while (!check("rightParen")) {
      definitions.push(valuePair());
    }
    consume("rightParen", "Expected ) after definitions");
    const body = functionValue();
    const { end } =
      consume("rightParen", "Expected ) after letrec statement").position;
    return {
      type: "letrec-statement",
      definitions,
      body,
      position: { start, end },
    };
  }
  function letStarStatement(): LetStarStatement {
    const { start } =
      consume("leftParen", "Expected ( before let* statement").position;
    consume("let*", "Expected let*");
    consume("leftParen", "Expected ( before definitions");
    const definitions: ValuePair[] = [];
    while (!check("rightParen")) {
      definitions.push(valuePair());
    }
    consume("rightParen", "Expected ) after definitions");
    const body = functionValue();
    const { end } =
      consume("rightParen", "Expected ) after let* statement").position;
    return {
      type: "letstar-statement",
      definitions,
      body,
      position: { start, end },
    };
  }
  function valuePair(): ValuePair {
    const { start } =
      consume("leftParen", "Expected ( before value pair").position;
    const name = identifier();
    const value = functionValue();
    const { end } =
      consume("rightParen", "Expected ) after value pair").position;
    return {
      type: "value-pair",
      name,
      value,
      position: { start, end },
    };
  }
  function requireStatement(): RequireStatement {
    const { start } =
      consume("leftParen", "Expected ( before require statement").position;
    consume("require", "Expected require");
    const module = identifier();
    const { end } =
      consume("rightParen", "Expected ) after require statement").position;
    return {
      type: "require-statement",
      module,
      position: { start, end },
    };
  }
  function miscFunction(): MiscFunction {
    const { start } =
      consume("leftParen", "Expected ( before function").position;
    const func = functionValue();
    const arguments_: FunctionValue[] = [];
    while (!check("rightParen")) {
      arguments_.push(functionValue());
    }
    const { end } = consume("rightParen", "Expected ) after function").position;
    return {
      type: "misc-function",
      func,
      arguments: arguments_,
      position: { start, end },
    };
  }
  function identifier(): Identifier {
    const token = consume("identifier", "Expected identifier");

    return {
      type: "identifier",
      value: token.value,
      position: token.position,
    };
  }
  function value(): Value {
    const token = peek();
    switch (token.type) {
      case "number-literal":
        return numberLiteral();
      case "number-exact":
        return numberExact();
      case "number-inexact":
        return numberInexact();
      case "string":
        return stringLiteral();
      case "boolean":
        return booleanLiteral();
      case "identifier":
        return identifier();
      case "symbol":
        return symbolValue();
      default:
        throw new Error(`Unexpected token: ${token.type}`);
    }
  }
  function numberLiteral(): NumberLiteral {
    const token = consume("number-literal", "Expected number literal");
    return {
      type: "number-literal",
      value: token.value,
      position: token.position,
    };
  }
  function numberExact(): NumberExact {
    const token = consume("number-exact", "Expected number exact");
    return {
      type: "number-exact",
      numerator: token.numerator,
      denominator: token.denominator,
      position: token.position,
    };
  }
  function numberInexact(): NumberInexact {
    const token = consume("number-inexact", "Expected number inexact");
    return {
      type: "number-inexact",
      value: token.value,
      position: token.position,
    };
  }
  function stringLiteral(): StringLiteral {
    const token = consume("string", "Expected string literal");
    return {
      type: "string-literal",
      value: token.value,
      position: token.position,
    };
  }
  function booleanLiteral(): BooleanLiteral {
    const token = consume("boolean", "Expected boolean literal");
    return {
      type: "boolean-literal",
      value: token.value,
      position: token.position,
    };
  }
  function symbolValue(): SymbolValue {
    const token = consume("symbol", "Expected symbol");
    return {
      type: "symbol-value",
      value: token.value,
      position: token.position,
    };
  }

  return program();
}
