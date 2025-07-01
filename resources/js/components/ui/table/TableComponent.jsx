import React from "react";

export default function TableComponent({
  columns = [],
  data = [],
  className = "",
  children,
  ...props
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full bg-white border rounded ${className}`} {...props}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 border-b font-semibold text-sm text-left bg-gray-50"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-gray-400">
                Tidak ada data
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 border-b text-sm">
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {children}
    </div>
  );
}
