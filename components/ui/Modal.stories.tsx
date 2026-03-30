import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "./Modal";
import { Button } from "./Button";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
    },
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    onClose: {
      action: "closed",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    title: "Confirm Action",
    description: "Are you sure you want to proceed?",
    children: (
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button variant="primary" size="sm">Confirm</Button>
      </div>
    ),
    onClose: () => {},
  },
};

export const WithLongContent: Story = {
  args: {
    isOpen: true,
    title: "Terms of Service",
    description: "Please read the following terms carefully",
    children: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm">Decline</Button>
          <Button variant="primary" size="sm">Accept</Button>
        </div>
      </div>
    ),
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: "Hidden Modal",
    children: null,
    onClose: () => {},
  },
};
