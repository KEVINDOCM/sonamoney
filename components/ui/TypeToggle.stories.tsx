import type { Meta, StoryObj } from "@storybook/react";
import TypeToggle from "./TypeToggle";

const meta: Meta<typeof TypeToggle> = {
  title: "UI/TypeToggle",
  component: TypeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "select",
      options: ["income", "expense"],
    },
    onChange: {
      action: "changed",
    },
    incomeLabel: {
      control: "text",
    },
    expenseLabel: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const IncomeSelected: Story = {
  args: {
    value: "income",
    incomeLabel: "Income",
    expenseLabel: "Expense",
  },
};

export const ExpenseSelected: Story = {
  args: {
    value: "expense",
    incomeLabel: "Income",
    expenseLabel: "Expense",
  },
};

export const CustomLabels: Story = {
  args: {
    value: "income",
    incomeLabel: "Money In",
    expenseLabel: "Money Out",
  },
};

export const WithState: Story = {
  args: {
    value: "expense",
    incomeLabel: "Earnings",
    expenseLabel: "Spending",
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive example with state management",
      },
    },
  },
};
