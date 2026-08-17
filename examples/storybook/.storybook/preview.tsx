import type { Preview } from "@storybook/react";
import { DirectionStoryDecorator } from "@rtl-resolver/react";
import { storybookDirectionToolbar } from "@rtl-resolver/testing";

const preview: Preview = {
  globalTypes: storybookDirectionToolbar,
  decorators: [DirectionStoryDecorator],
};

export default preview;
