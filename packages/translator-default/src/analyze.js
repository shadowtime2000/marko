import { types as t } from "@marko/babel-types";
import { isNativeTag } from "@marko/babel-utils";

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
    exit(path) {
      // check name
      let isStatic =
        isNativeTag(path) && !path.node.params && !path.node.arguments;

      // check if parent is a for
      // needed to handle global keys on elements that don't have specific key attributes
      const parent = path.parentPath.parentPath.node;
      if (isStatic && t.isMarkoTag(parent) && parent.name.value === "for") {
        isStatic = false;
      }

      // check attributes
      const attributes = path.get("attributes");
      const attrNames = Object.keys(attributes);
      isStatic =
        isStatic &&
        attrNames.every(attrName => {
          const attr = attributes[attrName];
          const value = attr.node.value;
          const literal =
            t.isStringLiteral(value) ||
            t.isNumericLiteral(value) ||
            t.isBooleanLiteral(value);
          return literal && !attr.node.arguments && !attr.node.modifier;
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
