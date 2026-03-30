import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "No transactions",
    description: "Add your first transaction to get started",
    buttonLabel: "Add Transaction",
    onClick: () => console.log("Clicked"),
  },
};

export const WithAction: Story = {
  args: {
    title: "Empty category",
    description: "This category has no items yet",
    action: <button className="text-blue-600">Custom Action</button>,
  },
};
