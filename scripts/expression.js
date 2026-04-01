/**
 * FDL Expression Parser
 *
 * Parses and validates FDL expressions used in `when:` conditions
 * and dynamic `value:` fields.
 *
 * Grammar:
 *   expression     = comparison ( ("and" | "or") comparison )*
 *   comparison     = operand operator operand
 *                  | operand "is" "null"
 *                  | operand "is" "not" "null"
 *   operand        = field_ref | literal | function_call
 *   field_ref      = identifier ( "." identifier )*
 *   literal        = number | string | boolean | duration | "now"
 *   function_call  = identifier "(" argument_list? ")"
 *   operator       = "==" | "!=" | ">" | ">=" | "<" | "<="
 *
 * Examples:
 *   failed_login_attempts >= 5
 *   amount > 1000 and status == "submitted"
 *   token.created_at < now - 60m
 *   request_count > 10 or ip_blocked == true
 *   user.email is not null
 *
 * Duration literals: 5s, 10m, 1h, 7d, 30d
 * Special values: now, null, true, false
 * Field references: dotted paths like user.email, token.created_at
 */

// ─── Token Types ─────────────────────────────────────────

const TokenType = {
  // Literals
  NUMBER: "NUMBER",
  STRING: "STRING",
  BOOLEAN: "BOOLEAN",
  DURATION: "DURATION",
  NOW: "NOW",
  NULL: "NULL",

  // Identifiers
  IDENTIFIER: "IDENTIFIER",

  // Operators
  EQ: "==",
  NEQ: "!=",
  GT: ">",
  GTE: ">=",
  LT: "<",
  LTE: "<=",

  // Arithmetic
  PLUS: "+",
  MINUS: "-",

  // Logical
  AND: "AND",
  OR: "OR",

  // Keywords
  IS: "IS",
  NOT: "NOT",

  // Punctuation
  DOT: ".",
  LPAREN: "(",
  RPAREN: ")",
  COMMA: ",",

  EOF: "EOF",
};

// ─── Lexer ───────────────────────────────────────────────

const KEYWORDS = {
  and: TokenType.AND,
  or: TokenType.OR,
  true: TokenType.BOOLEAN,
  false: TokenType.BOOLEAN,
  now: TokenType.NOW,
  null: TokenType.NULL,
  is: TokenType.IS,
  not: TokenType.NOT,
};

const DURATION_PATTERN = /^(\d+)(s|m|h|d)$/;

function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    // Skip whitespace
    if (/\s/.test(input[i])) {
      i++;
      continue;
    }

    // String literal
    if (input[i] === '"' || input[i] === "'") {
      const quote = input[i];
      let str = "";
      i++;
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          str += input[++i];
        } else {
          str += input[i];
        }
        i++;
      }
      if (i >= input.length) throw new Error(`Unterminated string at position ${i}`);
      i++; // skip closing quote
      tokens.push({ type: TokenType.STRING, value: str });
      continue;
    }

    // Two-character operators
    if (i + 1 < input.length) {
      const two = input[i] + input[i + 1];
      if (two === "==") { tokens.push({ type: TokenType.EQ, value: "==" }); i += 2; continue; }
      if (two === "!=") { tokens.push({ type: TokenType.NEQ, value: "!=" }); i += 2; continue; }
      if (two === ">=") { tokens.push({ type: TokenType.GTE, value: ">=" }); i += 2; continue; }
      if (two === "<=") { tokens.push({ type: TokenType.LTE, value: "<=" }); i += 2; continue; }
    }

    // Single-character operators/punctuation
    if (input[i] === ">") { tokens.push({ type: TokenType.GT, value: ">" }); i++; continue; }
    if (input[i] === "<") { tokens.push({ type: TokenType.LT, value: "<" }); i++; continue; }
    if (input[i] === "+") { tokens.push({ type: TokenType.PLUS, value: "+" }); i++; continue; }
    if (input[i] === "-") { tokens.push({ type: TokenType.MINUS, value: "-" }); i++; continue; }
    if (input[i] === ".") { tokens.push({ type: TokenType.DOT, value: "." }); i++; continue; }
    if (input[i] === "(") { tokens.push({ type: TokenType.LPAREN, value: "(" }); i++; continue; }
    if (input[i] === ")") { tokens.push({ type: TokenType.RPAREN, value: ")" }); i++; continue; }
    if (input[i] === ",") { tokens.push({ type: TokenType.COMMA, value: "," }); i++; continue; }

    // Number (including decimals)
    if (/\d/.test(input[i])) {
      let num = "";
      while (i < input.length && /[\d.]/.test(input[i])) {
        num += input[i++];
      }
      // Check if it's a duration (e.g., 60m, 15d)
      if (i < input.length && /[smhd]/.test(input[i]) && !/[a-zA-Z_]/.test(input[i + 1] || "")) {
        num += input[i++];
        const match = num.match(DURATION_PATTERN);
        if (match) {
          tokens.push({ type: TokenType.DURATION, value: num, amount: parseInt(match[1]), unit: match[2] });
          continue;
        }
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Identifier or keyword
    if (/[a-zA-Z_]/.test(input[i])) {
      let ident = "";
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i++];
      }
      const lower = ident.toLowerCase();
      if (KEYWORDS[lower] !== undefined) {
        tokens.push({ type: KEYWORDS[lower], value: lower === "true" ? true : lower === "false" ? false : lower });
      } else {
        tokens.push({ type: TokenType.IDENTIFIER, value: ident });
      }
      continue;
    }

    throw new Error(`Unexpected character '${input[i]}' at position ${i}`);
  }

  tokens.push({ type: TokenType.EOF, value: null });
  return tokens;
}

// ─── Parser ──────────────────────────────────────────────

function parse(tokens) {
  let pos = 0;

  function peek() { return tokens[pos]; }
  function advance() { return tokens[pos++]; }
  function expect(type) {
    const token = advance();
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type} (${JSON.stringify(token.value)})`);
    }
    return token;
  }

  // expression = comparison ( ("and" | "or") comparison )*
  function parseExpression() {
    let left = parseComparison();

    while (peek().type === TokenType.AND || peek().type === TokenType.OR) {
      const op = advance();
      const right = parseComparison();
      left = { type: "logical", operator: op.type === TokenType.AND ? "and" : "or", left, right };
    }

    return left;
  }

  // comparison = operand operator operand | operand "is" ["not"] "null"
  function parseComparison() {
    const left = parseAdditive();

    // is [not] null
    if (peek().type === TokenType.IS) {
      advance();
      if (peek().type === TokenType.NOT) {
        advance();
        expect(TokenType.NULL);
        return { type: "comparison", operator: "is_not_null", left, right: { type: "null" } };
      }
      expect(TokenType.NULL);
      return { type: "comparison", operator: "is_null", left, right: { type: "null" } };
    }

    const operators = [TokenType.EQ, TokenType.NEQ, TokenType.GT, TokenType.GTE, TokenType.LT, TokenType.LTE];
    if (operators.includes(peek().type)) {
      const op = advance();
      const right = parseAdditive();
      return { type: "comparison", operator: op.value, left, right };
    }

    return left;
  }

  // additive = operand ( ("+"|"-") operand )*
  function parseAdditive() {
    let left = parseOperand();

    while (peek().type === TokenType.PLUS || peek().type === TokenType.MINUS) {
      const op = advance();
      const right = parseOperand();
      left = { type: "arithmetic", operator: op.value, left, right };
    }

    return left;
  }

  // operand = field_ref | literal | "(" expression ")"
  function parseOperand() {
    const token = peek();

    // Grouped expression
    if (token.type === TokenType.LPAREN) {
      advance();
      const expr = parseExpression();
      expect(TokenType.RPAREN);
      return expr;
    }

    // Literals
    if (token.type === TokenType.NUMBER) { advance(); return { type: "number", value: token.value }; }
    if (token.type === TokenType.STRING) { advance(); return { type: "string", value: token.value }; }
    if (token.type === TokenType.BOOLEAN) { advance(); return { type: "boolean", value: token.value }; }
    if (token.type === TokenType.DURATION) { advance(); return { type: "duration", value: token.value, amount: token.amount, unit: token.unit }; }
    if (token.type === TokenType.NOW) { advance(); return { type: "now" }; }
    if (token.type === TokenType.NULL) { advance(); return { type: "null" }; }

    // Identifier (field ref, possibly dotted)
    if (token.type === TokenType.IDENTIFIER) {
      advance();
      let path = [token.value];
      while (peek().type === TokenType.DOT) {
        advance();
        const next = expect(TokenType.IDENTIFIER);
        path.push(next.value);
      }
      return { type: "field_ref", path: path.join(".") };
    }

    throw new Error(`Unexpected token: ${token.type} (${JSON.stringify(token.value)})`);
  }

  const ast = parseExpression();
  if (peek().type !== TokenType.EOF) {
    throw new Error(`Unexpected token after expression: ${peek().type} (${JSON.stringify(peek().value)})`);
  }
  return ast;
}

// ─── Public API ──────────────────────────────────────────

/**
 * Parse an FDL expression string into an AST.
 * Throws on syntax errors.
 */
export function parseExpression(input) {
  const tokens = tokenize(input);
  return parse(tokens);
}

/**
 * Validate an FDL expression string.
 * Returns { valid: true } or { valid: false, error: "message" }
 */
export function validateExpression(input) {
  try {
    parseExpression(input);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Extract all field references from an expression.
 * Useful for dependency analysis.
 */
export function extractFields(input) {
  const ast = parseExpression(input);
  const fields = new Set();

  function walk(node) {
    if (!node) return;
    if (node.type === "field_ref") fields.add(node.path);
    if (node.left) walk(node.left);
    if (node.right) walk(node.right);
  }

  walk(ast);
  return [...fields];
}
