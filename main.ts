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
type Token =
  & {
    position: {
      start: {
        line: number;
        column: number;
        index: number;
      };
      end: {
        line: number;
        column: number;
        index: number;
      };
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
    if (code[current] === "\n") {
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
  function matchLong(expected: string) {
    if (isAtEnd()) return false;
    if (code.substring(current, current + expected.length) !== expected) {
      return false;
    }

    current += expected.length;
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

export type DefineFunction = {
  type: "define-function";
  name: Identifier;
  signature: FunctionSignature;
  body: FunctionValue;
};
export type DefineConstant = {
  type: "define-constant";
  name: Identifier;
  value: FunctionValue;
};
export type DefineStruct = {
  type: "define-struct";
  name: Identifier;
  fields: Parameters;
};
export type FunctionSignature = TypedParameters | UntypedParameters;
export type Parameters = TypedParameters | UntypedParameters;
export type TypedParameters = {
  type: "typed-parameters";
  parameters: {
    name: Identifier;
    type: TypeAnnotation;
  }[];
  returnType: TypeAnnotation | null;
};
export type TypeAnnotation = TypeFunction | TypeLiteral;
export type TypeFunction = {
  type: "type-function";
  name: "List-of" | "Any";
};
export type TypeLiteral = {
  type: "type-literal";
  name: Identifier;
};
export type UntypedParameters = {
  type: "untyped-parameters";
  parameters: Identifier[];
};
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

export type IfStatement = {
  type: "if-statement";
  condition: FunctionValue;
  then: FunctionValue;
  else: FunctionValue;
};
export type CondStatement = {
  type: "cond-statement";
  clauses: CondClauseList;
};
export type CondClauseList = {
  type: "cond-clause-list";
  clauses: CondClause[];
  else: FunctionValue | null;
};
export type CondClause = {
  type: "cond-clause";
  condition: FunctionValue;
  then: FunctionValue;
};
export type LambdaStatement = {
  type: "lambda-statement";
  parameters: Parameters;
  body: FunctionValue;
};
export type LocalStatement = {
  type: "local-statement";
  definitions: Define[];
  body: FunctionValue;
};
export type LetStatement = {
  type: "let-statement";
  definitions: ValuePair[];
  body: FunctionValue;
};
export type LetRecStatement = {
  type: "letrec-statement";
  definitions: ValuePair[];
  body: FunctionValue;
};
export type LetStarStatement = {
  type: "letstar-statement";
  definitions: ValuePair[];
  body: FunctionValue;
};
export type ValuePair = {
  type: "value-pair";
  name: Identifier;
  value: FunctionValue;
};
export type RequireStatement = {
  type: "require-statement";
  module: Identifier;
};
export type MiscFunction = {
  type: "misc-function";
  name: Identifier;
  arguments: FunctionValue[];
};
export type Value =
  | NumberLiteral
  | NumberExact
  | NumberInexact
  | StringLiteral
  | BooleanLiteral
  | Identifier
  | SymbolValue;
export type NumberLiteral = {
  type: "number-literal";
  value: number;
};
export type NumberExact = {
  type: "number-exact";
  numerator: number;
  denominator: number;
};
export type NumberInexact = {
  type: "number-inexact";
  value: number;
};
export type StringLiteral = {
  type: "string-literal";
  value: string;
};
export type BooleanLiteral = {
  type: "boolean-literal";
  value: boolean;
};
export type Identifier = {
  type: "identifier";
  value: string;
};
export type SymbolValue = {
  type: "symbol-value";
  value: string;
};

export type WithLoc<T> = T & {
  position: {
    start: {
      line: number;
      column: number;
      index: number;
    };
    end: {
      line: number;
      column: number;
      index: number;
    };
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
  function consume<T extends Token["type"]>(type: T, message: string) {
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
    consume("leftParen", "Expected ( before define");
    consume("define", "Expected define");
    let d: Define;
    if (check("leftParen")) {
      d = defineFunction();
    } else {
      d = defineConstant();
    }
    consume("rightParen", "Expected ) after define");
    return d;
  }
  function defineFunction(): DefineFunction {
    consume("leftParen", "Expected ( before function signature");
    const name = identifier();
    const signature = functionSignature();
    consume("rightParen", "Expected ) after function signature");
    const body = functionValue();
    return {
      type: "define-function",
      name,
      signature,
      body,
    };
  }
  function defineConstant(): DefineConstant {
    const name = identifier();
    const value = functionValue();
    return {
      type: "define-constant",
      name,
      value,
    };
  }
  function defineStruct(): DefineStruct {
    consume("leftParen", "Expected ( before define-struct");
    consume("define-struct", "Expected define-struct");
    const name = identifier();
    consume("leftParen", "Expected ( before struct fields");
    const fields = parameters();
    consume("rightParen", "Expected ) after struct fields");
    consume("rightParen", "Expected ) after define-struct");
    return {
      type: "define-struct",
      name,
      fields,
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
    consume("leftParen", "Expected ( before type function");
    const name: Identifier = identifier();
    const type = {
      type: "type-function" as const,
      name: name.value as "List-of" | "Any",
    };
    consume("rightParen", "Expected ) after type function");
    return type;
  }
  function typeLiteral(): TypeLiteral {
    const name = identifier();
    return {
      type: "type-literal",
      name,
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
    consume("leftParen", "Expected ( before if statement");
    consume("if", "Expected if");
    const condition = functionValue();
    const then = functionValue();
    const else_ = functionValue();
    consume("rightParen", "Expected ) after if statement");
    return {
      type: "if-statement",
      condition,
      then,
      else: else_,
    };
  }
  function condStatement(): CondStatement {
    consume("leftParen", "Expected ( before cond statement");
    consume("cond", "Expected cond");
    const clauses = condClauseList();
    consume("rightParen", "Expected ) after cond statement");
    return {
      type: "cond-statement",
      clauses,
    };
  }
  function condClauseList(): CondClauseList {
    const clauses: CondClause[] = [];
    while (check("leftParen") && !checkNext("else")) {
      clauses.push(condClause());
    }
    let else_ = null;
    if (check("else")) {
      advance();
      else_ = functionValue();
    }
    return {
      type: "cond-clause-list",
      clauses,
      else: else_,
    };
  }
  function condClause(): CondClause {
    consume("leftParen", "Expected ( before cond clause");
    const condition = functionValue();
    const then = functionValue();
    consume("rightParen", "Expected ) after cond clause");
    return {
      type: "cond-clause",
      condition,
      then,
    };
  }
  function lambdaStatement(): LambdaStatement {
    consume("leftParen", "Expected ( before lambda statement");
    consume("lambda", "Expected lambda");
    consume("leftParen", "Expected ( before parameters");
    const params = parameters();
    consume("rightParen", "Expected ) after parameters");
    const body = functionValue();
    consume("rightParen", "Expected ) after lambda statement");
    return {
      type: "lambda-statement",
      parameters: params,
      body,
    };
  }
  function localStatement(): LocalStatement {
    consume("leftParen", "Expected ( before local statement");
    consume("local", "Expected local");
    consume("leftParen", "Expected ( before definitions");
    const definitions: Define[] = [];
    while (!check("rightParen")) {
      definitions.push(define());
    }
    consume("rightParen", "Expected ) after definitions");
    const body = functionValue();
    consume("rightParen", "Expected ) after local statement");
    return {
      type: "local-statement",
      definitions,
      body,
    };
  }
  function letStatement(): LetStatement {
    consume("leftParen", "Expected ( before let statement");
    consume("let", "Expected let");
    consume("leftParen", "Expected ( before definitions");
    const definitions: ValuePair[] = [];
    while (!check("rightParen")) {
      definitions.push(valuePair());
    }
    consume("rightParen", "Expected ) after definitions");
    const body = functionValue();
    consume("rightParen", "Expected ) after let statement");
    return {
      type: "let-statement",
      definitions,
      body,
    };
  }
  function letRecStatement(): LetRecStatement {
    consume("leftParen", "Expected ( before letrec statement");
    consume("letrec", "Expected letrec");
    consume("leftParen", "Expected ( before definitions");
    const definitions: ValuePair[] = [];
    while (!check("rightParen")) {
      definitions.push(valuePair());
    }
    consume("rightParen", "Expected ) after definitions");
    const body = functionValue();
    consume("rightParen", "Expected ) after letrec statement");
    return {
      type: "letrec-statement",
      definitions,
      body,
    };
  }
  function letStarStatement(): LetStarStatement {
    consume("leftParen", "Expected ( before let* statement");
    consume("let*", "Expected let*");
    consume("leftParen", "Expected ( before definitions");
    const definitions: ValuePair[] = [];
    while (!check("rightParen")) {
      definitions.push(valuePair());
    }
    consume("rightParen", "Expected ) after definitions");
    const body = functionValue();
    consume("rightParen", "Expected ) after let* statement");
    return {
      type: "letstar-statement",
      definitions,
      body,
    };
  }
  function valuePair(): ValuePair {
    consume("leftParen", "Expected ( before value pair");
    const name = identifier();
    const value = functionValue();
    consume("rightParen", "Expected ) after value pair");
    return {
      type: "value-pair",
      name,
      value,
    };
  }
  function requireStatement(): RequireStatement {
    consume("leftParen", "Expected ( before require statement");
    consume("require", "Expected require");
    const module = identifier();
    consume("rightParen", "Expected ) after require statement");
    return {
      type: "require-statement",
      module,
    };
  }
  function miscFunction(): MiscFunction {
    consume("leftParen", "Expected ( before function");
    const name = identifier();
    const arguments_: FunctionValue[] = [];
    while (!check("rightParen")) {
      arguments_.push(functionValue());
    }
    consume("rightParen", "Expected ) after function");
    return {
      type: "misc-function",
      name,
      arguments: arguments_,
    };
  }
  function identifier(): Identifier {
    const token = consume("identifier", "Expected identifier");

    return {
      type: "identifier",
      value: token.value,
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
    };
  }
  function numberExact(): NumberExact {
    const token = consume("number-exact", "Expected number exact");
    return {
      type: "number-exact",
      numerator: token.numerator,
      denominator: token.denominator,
    };
  }
  function numberInexact(): NumberInexact {
    const token = consume("number-inexact", "Expected number inexact");
    return {
      type: "number-inexact",
      value: token.value,
    };
  }
  function stringLiteral(): StringLiteral {
    const token = consume("string", "Expected string literal");
    return {
      type: "string-literal",
      value: token.value,
    };
  }
  function booleanLiteral(): BooleanLiteral {
    const token = consume("boolean", "Expected boolean literal");
    return {
      type: "boolean-literal",
      value: token.value,
    };
  }
  function symbolValue(): SymbolValue {
    const token = consume("symbol", "Expected symbol");
    return {
      type: "symbol-value",
      value: token.value,
    };
  }

  return program();
}
