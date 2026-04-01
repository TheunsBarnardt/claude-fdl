#!/usr/bin/env node

/**
 * FDL Blueprint Validator
 *
 * Validates blueprint YAML files against the FDL meta-schema.
 * Can validate a single file or all blueprints in the project.
 *
 * Usage:
 *   node scripts/validate.js                          # validate all
 *   node scripts/validate.js blueprints/auth/login.blueprint.yaml  # validate one
 */

import { readFileSync } from "fs";
import { resolve, relative } from "path";
import { glob } from "glob";
import YAML from "yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { validateExpression } from "./expression.js";

// ─── JSON Schema equivalent of our FDL meta-schema ────────
// This is the machine-readable validation layer

const blueprintJsonSchema = {
  type: "object",
  required: [
    "feature",
    "version",
    "description",
    "category",
    "rules",
    // fields is optional for system-driven features (webhooks, scheduled jobs)
    // flows and outcomes are conditionally required — checked in validateFile()
  ],
  properties: {
    feature: {
      type: "string",
      pattern: "^[a-z][a-z0-9-]*$",
      description: "Unique kebab-case identifier",
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
      description: "Semantic version",
    },
    description: {
      type: "string",
      maxLength: 200,
    },
    category: {
      type: "string",
      enum: [
        "auth",
        "data",
        "access",
        "ui",
        "integration",
        "notification",
        "payment",
        "workflow",
      ],
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    fields: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/$defs/field" },
    },
    rules: {
      type: "object",
      minProperties: 1,
    },
    flows: {
      type: "object",
      minProperties: 1,
    },
    outcomes: {
      type: "object",
      minProperties: 1,
    },
    related: {
      type: "array",
      items: { $ref: "#/$defs/relationship" },
    },
    events: {
      type: "array",
      items: { $ref: "#/$defs/event" },
    },
    errors: {
      type: "array",
      items: { $ref: "#/$defs/error" },
    },
    actors: {
      type: "array",
      items: { $ref: "#/$defs/actor" },
    },
    states: { type: "object" },
    sla: { type: "object" },
    ui_hints: { type: "object" },
    extensions: { type: "object" },
  },
  additionalProperties: false,
  $defs: {
    actor: {
      type: "object",
      required: ["id", "name", "type"],
      properties: {
        id: {
          type: "string",
          pattern: "^[a-z][a-z0-9_]*$",
        },
        name: { type: "string" },
        type: {
          type: "string",
          enum: ["human", "system", "external"],
        },
        description: { type: "string" },
        role: { type: "string" },
      },
      additionalProperties: false,
    },
    field: {
      type: "object",
      required: ["name", "type", "required"],
      properties: {
        name: {
          type: "string",
          pattern: "^[a-z][a-z0-9_]*$",
        },
        type: {
          type: "string",
          enum: [
            "text",
            "email",
            "password",
            "number",
            "boolean",
            "date",
            "datetime",
            "phone",
            "url",
            "file",
            "select",
            "multiselect",
            "hidden",
            "token",
            "rich_text",
            "json",
          ],
        },
        required: { type: "boolean" },
        label: { type: "string" },
        placeholder: { type: "string" },
        default: {},
        sensitive: { type: "boolean" },
        immutable: { type: "boolean" },
        form: { type: "string" },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              value: { type: "string" },
              label: { type: "string" },
            },
          },
        },
        validation: {
          type: "array",
          items: { $ref: "#/$defs/validationRule" },
        },
      },
      additionalProperties: false,
    },
    validationRule: {
      type: "object",
      required: ["type", "message"],
      properties: {
        type: {
          type: "string",
          enum: [
            "required",
            "minLength",
            "maxLength",
            "min",
            "max",
            "pattern",
            "email",
            "phone",
            "url",
            "oneOf",
            "unique",
            "match",
            "custom",
          ],
        },
        message: { type: "string" },
        value: {},
        field: { type: "string" },
      },
      additionalProperties: false,
    },
    relationship: {
      type: "object",
      required: ["feature", "type"],
      properties: {
        feature: { type: "string" },
        type: {
          type: "string",
          enum: ["required", "recommended", "optional", "extends"],
        },
        reason: { type: "string" },
        ui_link: { type: "string" },
        ui_link_position: { type: "string" },
        insert_after: { type: "string" },
      },
      additionalProperties: false,
    },
    event: {
      type: "object",
      required: ["name", "payload"],
      properties: {
        name: {
          type: "string",
          pattern: "^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$",
        },
        description: { type: "string" },
        payload: {
          type: "array",
          items: { type: "string" },
        },
      },
      additionalProperties: false,
    },
    error: {
      type: "object",
      required: ["code", "status", "message"],
      properties: {
        code: {
          type: "string",
          pattern: "^[A-Z][A-Z0-9_]*$",
        },
        status: {
          type: "integer",
          enum: [400, 401, 403, 404, 409, 422, 423, 429, 500],
        },
        message: { type: "string" },
        retry: { type: "boolean" },
        redirect: { type: "string" },
      },
      additionalProperties: false,
    },
  },
};

// ─── Validator ────────────────────────────────────────────

const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);
const validate = ajv.compile(blueprintJsonSchema);

function validateFile(filePath) {
  const absPath = resolve(filePath);
  const relPath = relative(process.cwd(), absPath);

  let content;
  try {
    content = readFileSync(absPath, "utf-8");
  } catch (err) {
    return { file: relPath, valid: false, errors: [`File not found: ${absPath}`] };
  }

  let data;
  try {
    data = YAML.parse(content);
  } catch (err) {
    return { file: relPath, valid: false, errors: [`YAML parse error: ${err.message}`] };
  }

  const valid = validate(data);

  if (!valid) {
    const errors = validate.errors.map((err) => {
      const path = err.instancePath || "(root)";
      return `  ${path}: ${err.message}${err.params ? ` (${JSON.stringify(err.params)})` : ""}`;
    });
    return { file: relPath, valid: false, errors };
  }

  // ─── Custom validation checks ───────────────────────────

  const customErrors = [];
  const customWarnings = [];

  // Check: must have at least one of flows or outcomes
  const hasFlows = data.flows && Object.keys(data.flows).length > 0;
  const hasOutcomes = data.outcomes && Object.keys(data.outcomes).length > 0;
  if (!hasFlows && !hasOutcomes) {
    customErrors.push('  (root): must have at least one of "flows" or "outcomes"');
  }

  // Check: fields is optional but warn if missing (system-driven features may skip it)
  if (!data.fields || data.fields.length === 0) {
    customWarnings.push(
      `${data.feature} has no fields — this is OK for system-driven features but unusual otherwise`
    );
  }

  // ─── Operator contracts ─────────────────────────────────
  // Each operator has a name, expected value type(s), and semantics

  const operatorContracts = {
    eq:         { accepts: ["string", "number", "boolean"], semantics: "=== strict equality" },
    neq:        { accepts: ["string", "number", "boolean"], semantics: "!== strict inequality" },
    gt:         { accepts: ["number", "duration"],          semantics: "> greater than" },
    gte:        { accepts: ["number", "duration"],          semantics: ">= greater than or equal" },
    lt:         { accepts: ["number", "duration"],          semantics: "< less than" },
    lte:        { accepts: ["number", "duration"],          semantics: "<= less than or equal" },
    in:         { accepts: ["array"],                       semantics: "value is contained in list" },
    not_in:     { accepts: ["array"],                       semantics: "value is not in list" },
    matches:    { accepts: ["string"],                      semantics: "regex test (value is the pattern)" },
    exists:     { accepts: [],                              semantics: "field is not null/undefined" },
    not_exists: { accepts: [],                              semantics: "field is null/undefined" },
  };

  const validOperators = new Set(Object.keys(operatorContracts));
  const validSources = new Set([
    "input", "db", "request", "session", "system", "computed",
  ]);

  // ─── Value type system ─────────────────────────────────
  // Typed values replace ambiguous strings

  const VALUE_TYPES = new Set([
    "string", "number", "boolean", "duration", "field_ref", "expression", "array", "null",
  ]);

  function inferValueType(value) {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (Array.isArray(value)) return "array";
    if (typeof value === "string") {
      // Duration: 5s, 10m, 1h, 7d, 30d
      if (/^\d+(s|m|h|d)$/.test(value)) return "duration";
      // Field reference: starts with letter, contains dots or underscores
      if (/^[a-z][a-z0-9_.]*$/.test(value) && !value.includes(" ")) return "field_ref";
      // Expression: contains operators
      if (/[><=!]|and |or /.test(value)) return "expression";
      return "string";
    }
    return "unknown";
  }

  // ─── Action contracts ──────────────────────────────────
  // Each action has required and optional properties

  const actionContracts = {
    set_field:        { required: ["target"], optional: ["value", "description", "when"] },
    emit_event:       { required: ["event"],  optional: ["payload", "description", "when"] },
    transition_state: { required: ["field"],  optional: ["from", "to", "description", "when"] },
    notify:           { required: ["channel"], optional: ["template", "to", "description", "when"] },
    invalidate:       { required: ["target"], optional: ["scope", "description", "when"] },
    create_record:    { required: ["target"], optional: ["description", "when"] },
    delete_record:    { required: ["target"], optional: ["description", "when"] },
    call_service:     { required: ["target"], optional: ["description", "when"] },
  };

  const validActions = new Set(Object.keys(actionContracts));

  // ─── Validate conditions (recursive, supports any/all) ─

  function validateCondition(condition, path) {
    if (typeof condition === "string") return; // plain-text, always valid
    if (typeof condition !== "object" || condition === null) return;

    // Logical group: any (OR) or all (AND)
    if (condition.any || condition.all) {
      const groupKey = condition.any ? "any" : "all";
      const items = condition[groupKey];
      if (!Array.isArray(items)) {
        customErrors.push(`  ${path}.${groupKey}: must be an array of conditions`);
        return;
      }
      for (let j = 0; j < items.length; j++) {
        validateCondition(items[j], `${path}.${groupKey}[${j}]`);
      }
      return;
    }

    // Structured condition
    if (!condition.field) {
      customErrors.push(`  ${path}: structured condition must have a "field" property`);
    }
    if (!condition.operator) {
      customErrors.push(`  ${path}: structured condition must have an "operator" property`);
    } else if (!validOperators.has(condition.operator)) {
      customErrors.push(
        `  ${path}: unknown operator "${condition.operator}" — valid: ${[...validOperators].join(", ")}`
      );
    } else {
      // Type-check: validate value type matches operator contract
      const contract = operatorContracts[condition.operator];
      if (contract.accepts.length > 0 && condition.value !== undefined) {
        const valueType = inferValueType(condition.value);
        if (valueType !== "unknown" && valueType !== "field_ref" && valueType !== "expression"
            && !contract.accepts.includes(valueType)) {
          customWarnings.push(
            `${path}: operator "${condition.operator}" expects ${contract.accepts.join("|")} but got ${valueType}`
          );
        }
      }
    }
    if (condition.source && !validSources.has(condition.source)) {
      customErrors.push(
        `  ${path}: unknown source "${condition.source}" — valid: ${[...validSources].join(", ")}`
      );
    }
    // Validate when: expression if present
    if (condition.when) {
      const exprResult = validateExpression(condition.when);
      if (!exprResult.valid) {
        customErrors.push(`  ${path}.when: invalid expression — ${exprResult.error}`);
      }
    }
  }

  // ─── Validate side effects ─────────────────────────────

  function validateSideEffect(effect, path) {
    if (typeof effect === "string") return;
    if (typeof effect !== "object" || effect === null) return;

    if (!effect.action) return; // no action key = plain-text-like object, skip

    if (!validActions.has(effect.action)) {
      customErrors.push(
        `  ${path}: unknown action "${effect.action}" — valid: ${[...validActions].join(", ")}`
      );
      return;
    }

    // Validate required properties for this action
    const contract = actionContracts[effect.action];
    for (const req of contract.required) {
      if (effect[req] === undefined) {
        customErrors.push(`  ${path}: action "${effect.action}" requires "${req}" property`);
      }
    }

    // Validate when: expression if present
    if (effect.when) {
      const exprResult = validateExpression(effect.when);
      if (!exprResult.valid) {
        customErrors.push(`  ${path}.when: invalid expression — ${exprResult.error}`);
      }
    }
  }

  // ─── Validate outcomes ─────────────────────────────────

  if (data.outcomes) {
    const validOutcomeKeys = new Set(["given", "then", "result", "priority", "error", "transaction"]);
    const errorCodes = new Set((data.errors || []).map((e) => e.code));

    for (const [name, outcome] of Object.entries(data.outcomes)) {
      if (typeof outcome !== "object" || outcome === null) {
        customErrors.push(`  outcomes.${name}: must be an object with given/then/result keys`);
        continue;
      }
      const outcomeKeys = Object.keys(outcome);
      const hasValidKey = outcomeKeys.some((k) => validOutcomeKeys.has(k));
      if (!hasValidKey) {
        customErrors.push(
          `  outcomes.${name}: must have at least one of "given", "then", or "result"`
        );
      }

      // Validate priority
      if (outcome.priority !== undefined && typeof outcome.priority !== "number") {
        customErrors.push(`  outcomes.${name}.priority: must be a number`);
      }

      // Validate error binding — must reference a defined error code
      if (outcome.error && !errorCodes.has(outcome.error)) {
        customErrors.push(
          `  outcomes.${name}.error: "${outcome.error}" is not defined in errors[]`
        );
      }

      // Validate transaction boundary
      if (outcome.transaction !== undefined && typeof outcome.transaction !== "boolean") {
        customErrors.push(`  outcomes.${name}.transaction: must be a boolean`);
      }

      // Validate conditions in given[]
      if (Array.isArray(outcome.given)) {
        for (let i = 0; i < outcome.given.length; i++) {
          validateCondition(outcome.given[i], `outcomes.${name}.given[${i}]`);
        }
      }

      // Validate structured side effects in then[]
      if (Array.isArray(outcome.then)) {
        for (let i = 0; i < outcome.then.length; i++) {
          validateSideEffect(outcome.then[i], `outcomes.${name}.then[${i}]`);
        }
      }
    }
  }

  if (customErrors.length > 0) {
    return { file: relPath, valid: false, errors: customErrors };
  }

  return {
    file: relPath,
    valid: true,
    feature: data.feature,
    version: data.version,
    warnings: customWarnings,
  };
}

// ─── Cross-blueprint relationship validation ──────────────

function validateRelationships(results) {
  const features = new Set(results.filter((r) => r.valid).map((r) => r.feature));
  const warnings = [];

  for (const result of results) {
    if (!result.valid) continue;

    const absPath = resolve(result.file);
    const content = readFileSync(absPath, "utf-8");
    const data = YAML.parse(content);

    if (data.related) {
      for (const rel of data.related) {
        if (rel.type === "required" && !features.has(rel.feature)) {
          warnings.push(
            `${result.feature} requires "${rel.feature}" but no blueprint found for it`
          );
        }
      }
    }
  }

  return warnings;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let files;

  if (args.length > 0) {
    files = args;
  } else {
    files = await glob("blueprints/**/*.blueprint.yaml");
  }

  if (files.length === 0) {
    console.log("No blueprint files found.");
    process.exit(0);
  }

  console.log(`\nFDL Blueprint Validator v0.1.0`);
  console.log(`${"=".repeat(50)}\n`);

  const results = files.map(validateFile);
  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.valid) {
      console.log(`  PASS  ${result.file} (${result.feature} v${result.version})`);
      passed++;
    } else {
      console.log(`  FAIL  ${result.file}`);
      for (const err of result.errors) {
        console.log(`        ${err}`);
      }
      failed++;
    }
  }

  // Collect all warnings: per-file custom warnings + cross-reference warnings
  const allWarnings = [];

  for (const result of results) {
    if (result.valid && result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  allWarnings.push(...validateRelationships(results));

  if (allWarnings.length > 0) {
    console.log(`\n  WARNINGS:`);
    for (const w of allWarnings) {
      console.log(`    WARN  ${w}`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${allWarnings.length} warnings`);
  console.log(`${"=".repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
