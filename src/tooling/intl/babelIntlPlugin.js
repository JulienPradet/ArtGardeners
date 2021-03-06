const { dirname, relative, join } = require("path");
const { types: t } = require("@babel/core");
const { parse } = require("intl-messageformat-parser");
const { readFile, writeFile, readFileSync } = require("fs");
const chokidar = require("chokidar");

const debug = require("debug")("artgardeners:babel-plugin-intl");

const HELPERS_MAP = {
  1: "__interpolate",
  2: "__number",
  3: "__date",
  4: "__time",
  5: "__select",
  6: "__plural",
};
const PLURAL_ABBREVIATIONS = {
  zero: "z",
  one: "o",
  two: "t",
  few: "f",
  many: "m",
  other: "h",
};

const translationManagers = new Map();
const getTranslationsManager = (locale, translationsFolder) => {
  if (!translationManagers.has(locale)) {
    const translationsFile = join(translationsFolder, `${locale}.json`);
    let rawMessages = "{}";
    try {
      rawMessages = readFileSync(translationsFile);
    } catch (e) {
      debug(
        `Creating new translations for locale ${locale} in ${JSON.stringify(
          translationsFile
        )}`
      );
    }

    let messages = JSON.parse(rawMessages);

    const readTranslations = () => {
      return new Promise((resolve, reject) => {
        readFile(translationsFile, (err, buffer) => {
          if (err) {
            console.error(
              `Failed to read translation for locale ${locale}. Does the file ${translationsFile} exist?`
            );
            reject(err);
            return;
          }

          messages = JSON.parse(buffer.toString());

          resolve();
        });
      });
    };

    let throttle;
    const updateTranslations = (messages) => {
      if (throttle) {
        clearTimeout(throttle);
      }

      throttle = setTimeout(() => {
        throttle = null;
        new Promise((resolve, reject) => {
          debug(`Updating translation file for ${locale}.`);
          writeFile(
            translationsFile,
            JSON.stringify(messages, null, 2),
            (error) => {
              if (error) {
                console.error(
                  `Failed to add missing translation for ${locale}.`
                );
                console.error(error);
                return;
              }

              resolve();
            }
          );
        });
      }, 200);
    };

    chokidar.watch(translationsFile).on("change", () => {
      debug(`Translation change detected`);
      translations = readTranslations();
    });

    translationManagers.set(locale, {
      get: (messageId) => {
        if (!messages[messageId]) {
          messages[messageId] = messageId;
          debug(
            `New translation found for locale ${locale}: ${JSON.stringify(
              messageId
            )}`
          );
          updateTranslations(messages);
        }

        return messages[messageId];
      },
    });
  }

  return translationManagers.get(locale);
};

const babelIntlPlugin = (api, options) => {
  const translations = getTranslationsManager(
    options.locale,
    options.translationsFolder
  );

  let usedHelpers = new Set();
  let currentFunctionParams = new Set();
  let pluralsStack = [];

  function normalizePluralKey(key) {
    key = key.trim();
    let match = key.match(/^=(\d)/);
    if (match) return parseInt(match[1], 10);
    return PLURAL_ABBREVIATIONS[key] || key;
  }

  function normalizeKey(key) {
    key = key.trim();
    let match = key.match(/^=(\d)/);
    if (match) return parseInt(match[1], 10);
    return key;
  }

  function buildCallExpression(entry) {
    let fnName = HELPERS_MAP[entry.type];
    if (fnName === "__plural" && entry.offset !== 0) {
      usedHelpers.add("__offsetPlural");
    } else {
      usedHelpers.add(fnName);
    }
    if (
      fnName === "__interpolate" ||
      fnName === "__number" ||
      fnName === "__date" ||
      fnName === "__time"
    ) {
      let callArgs = [t.identifier(entry.value)];
      if (entry.style) callArgs.push(t.stringLiteral(entry.style));
      return t.callExpression(t.identifier(fnName), callArgs);
    }
    if (fnName === "__plural") {
      pluralsStack.push(entry);
    }
    let options = t.objectExpression(
      Object.keys(entry.options).map((key) => {
        let objValueAST = entry.options[key].value;
        let objValue;
        if (objValueAST.length === 1 && objValueAST[0].type === 0) {
          objValue = t.stringLiteral(objValueAST[0].value);
        } else {
          objValue =
            objValueAST.length === 1
              ? buildCallExpression(objValueAST[0])
              : buildTemplateLiteral(objValueAST);
        }
        let normalizedKey =
          fnName === "__plural" ? normalizePluralKey(key) : normalizeKey(key);
        return t.objectProperty(
          typeof normalizedKey === "number"
            ? t.numericLiteral(normalizedKey)
            : t.identifier(normalizedKey),
          objValue
        );
      })
    );
    if (fnName === "__plural") {
      pluralsStack.pop();
    }
    currentFunctionParams.add(entry.value);
    let fnIdentifier = t.identifier(fnName);
    let callArguments = [t.identifier(entry.value)];
    if (fnName === "__plural" && entry.offset !== 0) {
      fnIdentifier = t.identifier("__offsetPlural");
      callArguments.push(t.numericLiteral(entry.offset));
    }
    callArguments.push(options);
    return t.callExpression(fnIdentifier, callArguments);
  }

  function buildTemplateLiteral(ast) {
    let quasis = [];
    let expressions = [];
    for (let i = 0; i < ast.length; i++) {
      let entry = ast[i];
      switch (entry.type) {
        case 0: // literal
          quasis.push(
            t.templateElement(
              { value: entry.value, raw: entry.value },
              i === ast.length - 1 // tail
            )
          );
          break;
        case 1: // intepolation
          expressions.push(buildCallExpression(entry));
          currentFunctionParams.add(entry.value);
          if (i === 0)
            quasis.push(t.templateElement({ value: "", raw: "" }, false));
          break;
        case 2: // Number format
          expressions.push(buildCallExpression(entry));
          currentFunctionParams.add(entry.value);
          break;
        case 3: // Date format
          expressions.push(buildCallExpression(entry));
          currentFunctionParams.add(entry.value);
          break;
        case 4: // Time format
          expressions.push(buildCallExpression(entry));
          currentFunctionParams.add(entry.value);
          break;
        case 5: // select
          expressions.push(buildCallExpression(entry));
          break;
        case 6: // plural
          expressions.push(buildCallExpression(entry));
          break;
        case 7: // # interpolation
          let lastPlural = pluralsStack[pluralsStack.length - 1];
          if (lastPlural.offset !== null && lastPlural.offset !== 0) {
            expressions.push(
              t.binaryExpression(
                "-",
                t.identifier(lastPlural.value),
                t.numericLiteral(lastPlural.offset)
              )
            );
          } else {
            expressions.push(t.identifier(lastPlural.value));
          }
          if (i === 0)
            quasis.push(t.templateElement({ value: "", raw: "" }, false));
          break;
        default:
          debugger;
      }
      if (i === ast.length - 1 && entry.type !== 0) {
        quasis.push(t.templateElement({ value: "", raw: "" }, true));
      }
    }
    return t.templateLiteral(quasis, expressions);
  }

  function buildFunction(ast) {
    currentFunctionParams = new Set();
    pluralsStack = [];
    let body =
      ast.length === 1
        ? buildCallExpression(ast[0])
        : buildTemplateLiteral(ast);
    return t.arrowFunctionExpression(
      Array.from(currentFunctionParams)
        .sort()
        .map((p) => t.identifier(p)),
      body
    );
  }

  return {
    visitor: {
      Program: {
        enter: () => {
          usedHelpers = new Set();
        },
        exit(path, state) {
          this.file.metadata.usesIntl = usedHelpers.size > 0;
          if (usedHelpers.size > 0) {
            let importDeclaration = t.importDeclaration(
              Array.from(usedHelpers)
                .sort()
                .map((name) =>
                  t.importSpecifier(t.identifier(name), t.identifier(name))
                ),
              t.stringLiteral(
                relative(
                  dirname(state.filename),
                  join(__dirname, "../../server/view/modules/intl")
                )
              )
            );
            path.unshiftContainer("body", importDeclaration);
          }
        },
      },
      CallExpression({ node }) {
        if (t.isIdentifier(node.callee) && node.callee.name === "_") {
          if (node.arguments?.length >= 1 && t.isLiteral(node.arguments[0])) {
            const messageId = node.arguments[0].value;
            const translatedMessage = translations.get(messageId);

            const icuAST = parse(translatedMessage);
            if (icuAST.length === 1 && icuAST[0].type === 0) {
              node.arguments[0] = t.stringLiteral(translatedMessage);
            } else {
              node.arguments[0] = buildFunction(icuAST);
            }
          }
        }
      },
    },
  };
};

module.exports = babelIntlPlugin;
