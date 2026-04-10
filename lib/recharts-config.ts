// Configure recharts to not use new Function() for CSP compliance
// This must be imported BEFORE any recharts imports

if (typeof window !== "undefined") {
  // Disable function constructor usage in recharts for CSP compliance
  (window as Window & { recharts?: { useFunctionConstructor?: boolean } }).recharts = {
    useFunctionConstructor: false,
  };
}

// Re-export recharts components after configuration
export {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  LabelList,
} from "recharts";
