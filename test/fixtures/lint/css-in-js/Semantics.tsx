import { css } from "@emotion/react";
import styled from "styled-components";

type Pos = { left: number; right: number };

export const typeProbe: Pos = { left: 0, right: 0 };

export const objectBox = css({
  marginLeft: 8,
  left: 0,
});

export const kebabBox = css({
  "margin-left": "1rem",
  textAlign: "left",
  transform: "translateX(8px)",
  padding: "1px 2px 3px 4px",
});

export const callbackBox = css(
  () => `
    padding-right: 8px;
    float: right;
    left: 0;
  `,
);

export const vanilla = style({
  paddingLeft: 4,
});

export function EmotionCssProp() {
  return <div css={{ marginLeft: 2, left: 0 }} />;
}

function style(value: object) {
  return value;
}

export const Box = styled.div`
  margin-left: ${"1rem"};
`;
