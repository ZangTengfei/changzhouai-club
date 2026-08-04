import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const projectRoot = process.cwd();
const miniappRoot = path.join(projectRoot, "miniapp", "miniprogram");
const analyticsRoutePath = path.join(
  projectRoot,
  "src",
  "app",
  "api",
  "miniapp",
  "analytics",
  "route.ts",
);

function walkTypeScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkTypeScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".ts") ? [entryPath] : [];
  });
}

function parseTypeScript(filePath) {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function extractStaticEventNames(node) {
  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isParenthesizedExpression(node)) {
    return extractStaticEventNames(node.expression);
  }
  if (ts.isConditionalExpression(node)) {
    const whenTrue = extractStaticEventNames(node.whenTrue);
    const whenFalse = extractStaticEventNames(node.whenFalse);
    return whenTrue && whenFalse ? [...whenTrue, ...whenFalse] : null;
  }
  return null;
}

function collectClientEvents() {
  const events = new Map();
  const dynamicCalls = [];

  for (const filePath of walkTypeScriptFiles(miniappRoot)) {
    const sourceFile = parseTypeScript(filePath);
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "trackEvent"
      ) {
        const eventName = node.arguments[0];
        const location = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const relativePath = path.relative(projectRoot, filePath);
        const sourceLocation = `${relativePath}:${location.line + 1}`;

        const eventNames = eventName ? extractStaticEventNames(eventName) : null;
        if (eventNames) {
          for (const staticEventName of eventNames) {
            const locations = events.get(staticEventName) ?? [];
            locations.push(sourceLocation);
            events.set(staticEventName, locations);
          }
        } else {
          dynamicCalls.push(sourceLocation);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return { events, dynamicCalls };
}

function collectAllowedEvents() {
  const sourceFile = parseTypeScript(analyticsRoutePath);
  let allowedEvents = null;

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "ALLOWED_EVENTS" &&
      node.initializer &&
      ts.isNewExpression(node.initializer)
    ) {
      const values = node.initializer.arguments?.[0];
      if (values && ts.isArrayLiteralExpression(values)) {
        allowedEvents = new Set(
          values.elements
            .filter(ts.isStringLiteralLike)
            .map((element) => element.text),
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (!allowedEvents) {
    throw new Error("未找到 analytics API 的 ALLOWED_EVENTS 字符串数组");
  }
  return allowedEvents;
}

const { events: clientEvents, dynamicCalls } = collectClientEvents();
const allowedEvents = collectAllowedEvents();
const missingEvents = [...clientEvents.keys()]
  .filter((eventName) => !allowedEvents.has(eventName))
  .sort();

if (dynamicCalls.length > 0 || missingEvents.length > 0) {
  if (dynamicCalls.length > 0) {
    console.error("trackEvent 的事件名必须是字符串常量：");
    for (const location of dynamicCalls) console.error(`- ${location}`);
  }
  if (missingEvents.length > 0) {
    console.error("以下小程序事件未加入 analytics API 白名单：");
    for (const eventName of missingEvents) {
      console.error(`- ${eventName}: ${clientEvents.get(eventName).join(", ")}`);
    }
  }
  process.exit(1);
}

console.log(
  `Analytics 事件校验通过：客户端使用的 ${clientEvents.size} 个事件均在 API 白名单中。`,
);
