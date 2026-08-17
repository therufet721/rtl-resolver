import type { Meta, StoryObj } from "@storybook/react";

function Panel() {
  return (
    <section>
      <h1>Inbox</h1>
      <p>مرحبا بالعالم</p>
      <p>שלום עולם</p>
      <button type="button">Next</button>
    </section>
  );
}

const meta = {
  title: "Direction/Panel",
  component: Panel,
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedScripts: Story = {};
