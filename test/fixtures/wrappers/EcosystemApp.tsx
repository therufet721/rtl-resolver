import React from "react";
import {
  MuiDirectionProvider,
  MuiDirectionSelect,
} from "@rtl-resolver/mui";
import {
  RadixDirectionProvider,
  RadixDropdownMenu,
} from "@rtl-resolver/radix";
import {
  HeadlessListbox,
  HeadlessUiDirectionProvider,
} from "@rtl-resolver/headless-ui";

export function EcosystemApp() {
  return (
    <main>
      <MuiDirectionProvider locale="ar">
        <MuiDirectionSelect native value="one" aria-label="MUI direction fixture">
          <option value="one">One</option>
          <option value="two">Two</option>
        </MuiDirectionSelect>
      </MuiDirectionProvider>
      <RadixDirectionProvider locale="he">
        <RadixDropdownMenu>
          <span>Radix closed menu</span>
        </RadixDropdownMenu>
      </RadixDirectionProvider>
      <HeadlessUiDirectionProvider locale="fa">
        <HeadlessListbox value="one" onChange={() => undefined}>
          <span>Headless closed listbox</span>
        </HeadlessListbox>
      </HeadlessUiDirectionProvider>
    </main>
  );
}
