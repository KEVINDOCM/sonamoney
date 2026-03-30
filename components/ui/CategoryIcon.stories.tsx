import type { Meta, StoryObj } from "@storybook/react";
import { CategoryIcon } from "./CategoryIcon";

const meta: Meta<typeof CategoryIcon> = {
  title: "UI/CategoryIcon",
  component: CategoryIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: "text",
      description: "Emoji icon to display",
    },
    color: {
      control: "color",
      description: "Color for the dot background",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the icon",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEmoji: Story = {
  args: {
    icon: "🍔",
    size: "md",
  },
};

export const WithColor: Story = {
  args: {
    color: "#00C48C",
    size: "md",
  },
};

export const Small: Story = {
  args: {
    icon: "💰",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    icon: "🏠",
    size: "lg",
  },
};
