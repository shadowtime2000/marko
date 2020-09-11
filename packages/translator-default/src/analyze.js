import { types as t } from "@marko/babel-types";
import { isNativeTag, getTagDef } from "@marko/babel-utils";

export const staticNodes = new WeakSet();

export const visitor = {
  MarkoText(path) {
    staticNodes.add(path.node);
  },
  MarkoPlaceholder(path) {
    const { confident } = path.get("value").evaluate();
    if (confident && path.node.escape) staticNodes.add(path.node);
  },
  MarkoTag: {
    enter(path) {
      // check if a for
      // needed to handle global keys on elements that don't have specific key attributes
      if (path.node.name.value === "for") path.skip();
    },
    exit(path) {
      // check name
      let isStatic =
        isNativeTag(path) && !path.node.params && !path.node.arguments;

      const tagDef = getTagDef(path);
      isStatic = isStatic && !tagDef.codeGeneratorModulePath;

      // check attributes
      isStatic =
        isStatic &&
        path.get("attributes").every(attr => {
          if (!t.isMarkoAttribute(attr)) return false;
          const attrValue = attr.get("value");
          const { confident } = attrValue.evaluate();
          const exclude =
            t.isObjectExpression(attrValue) ||
            t.isArrayExpression(attrValue) ||
            t.isRegExpLiteral(attrValue);
          return (
            confident && !exclude && !attr.node.arguments && !attr.node.modifier
          );
        });

      // check children
      isStatic =
        isStatic &&
        path
          .get("body")
          .get("body")
          .every(t => staticNodes.has(t.node));
      if (isStatic) staticNodes.add(path.node);
    }
  }
};
