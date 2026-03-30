import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    transparent: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-4">
        <h3 className="font-semibold">Card Title</h3>
        <p className="text-gray-600">Card content goes here.</p>
      </div>
    ),
  },
};

export const Transparent: Story = {
  args: {
    transparent: true,
    children: (
      <div className="p-4">
        <h3 className="font-semibold">Transparent Card</h3>
        <p className="text-gray-600">No background or border.</p>
      </div>
    ),
  },
};
