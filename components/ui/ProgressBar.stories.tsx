import type { Meta, StoryObj } from "@storybook/react";
import ProgressBar from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "UI/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    percentage: {
      control: { type: "range", min: 0, max: 100 },
      description: "Progress percentage (0-100)",
    },
    warningThreshold: {
      control: { type: "number", min: 0, max: 100 },
      description: "Percentage at which warning color appears",
    },
    dangerThreshold: {
      control: { type: "number", min: 0, max: 100 },
      description: "Percentage at which danger color appears",
    },
    showLabel: {
      control: "boolean",
      description: "Show percentage label",
    },
    label: {
      control: "text",
      description: "Custom label text",
    },
    height: {
      control: "select",
      options: ["sm", "md"],
      description: "Bar height",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Low: Story = {
  args: {
    percentage: 25,
    showLabel: true,
    label: "Budget used",
  },
};

export const Medium: Story = {
  args: {
    percentage: 65,
    showLabel: true,
    label: "Storage used",
  },
};

export const Warning: Story = {
  args: {
    percentage: 75,
    showLabel: true,
    label: "Approaching limit",
  },
};

export const Danger: Story = {
  args: {
    percentage: 95,
    showLabel: true,
    label: "Critical level",
  },
};

export const CustomThresholds: Story = {
  args: {
    percentage: 60,
    warningThreshold: 50,
    dangerThreshold: 80,
    showLabel: true,
    label: "Custom thresholds",
  },
};

export const Small: Story = {
  args: {
    percentage: 45,
    height: "sm",
    showLabel: false,
  },
};
