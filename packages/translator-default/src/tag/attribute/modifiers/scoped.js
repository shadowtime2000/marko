import { types as t } from "@marko/babel-types";
import withPreviousLocation from "../../../util/with-previous-location";

export default {
  exit(tag, _, value) {
    const {
      hub: { file }
    } = tag;
    value.replaceWith(
      withPreviousLocation(
        t.callExpression(
          t.memberExpression(
            t.identifier("_component"),
            t.identifier("elId")
          ),
          [value.node]
        ),
        value.node
      )
    );
  }
};
