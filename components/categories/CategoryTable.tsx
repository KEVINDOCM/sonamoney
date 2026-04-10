"use client";

import { Tag, Wallet, Banknote, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/types";

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddClick: () => void;
  headers: {
    name: string;
    type: string;
    budget: string;
    icon: string;
    actions: string;
  };
  labels: {
    income: string;
    expense: string;
    noCategories: string;
    noCategoriesDesc: string;
    add: string;
    edit: string;
    delete: string;
  };
}

export function CategoryTable({
  categories,
  onEdit,
  onDelete,
  onAddClick,
  headers,
  labels,
}: CategoryTableProps) {
  return (
    <div>
      {/* ==============================
          MOBILE — Card List View
          ============================== */}
      <div className="block lg:hidden">
        {categories.length === 0 ? (
          <div className="
            mx-4 bg-white dark:bg-gray-900
            rounded-2xl shadow-sm p-10
            flex flex-col items-center
            text-center animate-fadeIn
          ">
            <Tag className="w-10 h-10 mb-3 text-slate-400" />
            <p className="
              text-sm font-semibold
              text-[#1A1A2E] dark:text-white
            ">
              {labels.noCategories}
            </p>
            <p className="
              text-xs text-[#6B7280] mt-1
            ">
              {labels.noCategoriesDesc}
            </p>
            <button
              onClick={onAddClick}
              className="
                mt-4 btn-primary text-sm
                inline-flex items-center gap-1
              "
            >
              + {labels.add}
            </button>
          </div>
        ) : (
          <div className="
            px-4 space-y-2 stagger-children
          ">
            {categories.map((category) => (
              <div
                key={category.id}
                className="
                  bg-white dark:bg-gray-900
                  rounded-2xl shadow-sm p-4
                  flex items-center gap-3
                  hover:shadow-md
                  hover:-translate-y-0.5
                  transition-all duration-200
                  animate-slideUp
                "
              >
                {/* Icon */}
                <div className="
                  w-10 h-10 rounded-xl shrink-0
                  flex items-center justify-center
                  bg-[#F5F7FA] dark:bg-gray-800
                ">
                  {category.icon ? (
                    <span className="text-lg">{category.icon}</span>
                  ) : (
                    category.type === "income" ? (
                      <Wallet className="w-5 h-5 text-[#00C48C]" />
                    ) : (
                      <Banknote className="w-5 h-5 text-[#FF5B5B]" />
                    )
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="
                    text-sm font-bold
                    text-[#1A1A2E] dark:text-white
                    truncate
                  ">
                    {category.name}
                  </p>
                  <div className="
                    flex items-center gap-2 mt-0.5
                  ">
                    <span className={`
                      text-[10px] font-semibold
                      px-2 py-0.5 rounded-full
                      ${category.type === "income"
                        ? "bg-[#E6FAF4] text-[#00C48C]"
                        : "bg-[#FFF0F0] text-[#FF5B5B]"
                      }
                    `}>
                      {category.type === "income"
                        ? labels.income
                        : labels.expense}
                    </span>
                    {category.budget_limit && (
                      <span className="
                        text-[10px] font-semibold
                        px-2 py-0.5 rounded-full
                        bg-[#E6F7F6] text-[#00B9A7]
                      ">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                          notation: "compact",
                        }).format(category.budget_limit)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="
                  flex items-center gap-1 shrink-0
                ">
                  <button
                    onClick={() => onEdit(category)}
                    className="
                      w-8 h-8 rounded-xl
                      flex items-center justify-center
                      text-[#6B7280] dark:text-gray-400
                      hover:bg-[#E6F7F6]
                      hover:text-[#00B9A7]
                      active:scale-95
                      transition-all duration-200
                    "
                    aria-label={labels.edit}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(category)}
                    className="
                      w-8 h-8 rounded-xl
                      flex items-center justify-center
                      text-[#6B7280] dark:text-gray-400
                      hover:bg-[#FFF0F0]
                      hover:text-[#FF5B5B]
                      active:scale-95
                      transition-all duration-200
                    "
                    aria-label={labels.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==============================
          DESKTOP — Table View
          ============================== */}
      <div className="hidden lg:block">
        <div className="
          bg-white dark:bg-gray-900
          rounded-2xl shadow-sm
          overflow-hidden
        ">
          <table className="
            min-w-full divide-y
            divide-gray-100 dark:divide-gray-800
          ">
            <thead className="
              bg-[#F5F7FA] dark:bg-gray-800/50
            ">
              <tr>
                <th className="
                  px-5 py-3 text-left
                  text-[11px] font-bold
                  text-[#6B7280] dark:text-gray-400
                  uppercase tracking-wider
                ">
                  {headers.icon}
                </th>
                <th className="
                  px-5 py-3 text-left
                  text-[11px] font-bold
                  text-[#6B7280] dark:text-gray-400
                  uppercase tracking-wider
                ">
                  {headers.name}
                </th>
                <th className="
                  px-5 py-3 text-left
                  text-[11px] font-bold
                  text-[#6B7280] dark:text-gray-400
                  uppercase tracking-wider
                ">
                  {headers.type}
                </th>
                <th className="
                  px-5 py-3 text-left
                  text-[11px] font-bold
                  text-[#6B7280] dark:text-gray-400
                  uppercase tracking-wider
                ">
                  {headers.budget}
                </th>
                <th className="
                  px-5 py-3 text-right
                  text-[11px] font-bold
                  text-[#6B7280] dark:text-gray-400
                  uppercase tracking-wider
                ">
                  {headers.actions}
                </th>
              </tr>
            </thead>
            <tbody className="
              bg-white dark:bg-gray-900
              divide-y divide-gray-50
              dark:divide-gray-800
            ">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="
                      flex flex-col items-center
                      justify-center py-12
                      text-center
                    ">
                      <Tag className="w-10 h-10 mb-3 text-slate-400" />
                      <p className="
                        text-sm font-semibold
                        text-[#1A1A2E] dark:text-white
                      ">
                        {labels.noCategories}
                      </p>
                      <p className="
                        text-xs text-[#6B7280] mt-1
                      ">
                        {labels.noCategoriesDesc}
                      </p>
                      <button
                        onClick={onAddClick}
                        className="
                          mt-4 btn-primary text-sm
                          inline-flex items-center gap-1
                        "
                      >
                        + {labels.add}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.id}
                    className="
                      hover:bg-[#F5F7FA]
                      dark:hover:bg-gray-800/50
                      transition-colors duration-150
                      cursor-default
                    "
                  >
                    {/* Icon */}
                    <td className="px-5 py-3.5">
                      <div className="
                        w-8 h-8 rounded-lg
                        flex items-center justify-center
                        bg-[#F5F7FA] dark:bg-gray-800
                      ">
                        {category.icon ? (
                          <span className="text-base">{category.icon}</span>
                        ) : (
                          category.type === "income" ? (
                            <Wallet className="w-4 h-4 text-[#00C48C]" />
                          ) : (
                            <Banknote className="w-4 h-4 text-[#FF5B5B]" />
                          )
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <span className="
                        text-sm font-semibold
                        text-[#1A1A2E] dark:text-white
                        truncate max-w-xs block
                      ">
                        {category.name}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span className={`
                        text-xs font-semibold
                        px-2.5 py-1 rounded-full
                        ${category.type === "income"
                          ? "bg-[#E6FAF4] text-[#00C48C]"
                          : "bg-[#FFF0F0] text-[#FF5B5B]"
                        }
                      `}>
                        {category.type === "income"
                          ? labels.income
                          : labels.expense}
                      </span>
                    </td>

                    {/* Budget */}
                    <td className="px-5 py-3.5">
                      {category.budget_limit ? (
                        <span className="
                          text-xs font-semibold
                          px-2.5 py-1 rounded-full
                          bg-[#E6F7F6] text-[#00B9A7]
                        ">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(category.budget_limit)}
                        </span>
                      ) : (
                        <span className="
                          text-xs text-[#6B7280]
                          dark:text-gray-500 italic
                        ">
                          —
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="
                        flex items-center
                        justify-end gap-1
                      ">
                        <button
                          onClick={() => onEdit(category)}
                          className="
                            w-8 h-8 rounded-lg
                            flex items-center justify-center
                            text-[#6B7280]
                            hover:bg-[#E6F7F6]
                            hover:text-[#00B9A7]
                            active:scale-95
                            transition-all duration-200
                          "
                          aria-label={labels.edit}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(category)}
                          className="
                            w-8 h-8 rounded-lg
                            flex items-center justify-center
                            text-[#6B7280]
                            hover:bg-[#FFF0F0]
                            hover:text-[#FF5B5B]
                            active:scale-95
                            transition-all duration-200
                          "
                          aria-label={labels.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
