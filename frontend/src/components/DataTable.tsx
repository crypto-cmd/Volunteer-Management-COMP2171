import React from "react";

export type DataTableColumn = {
    key: string;
    header: React.ReactNode;
    headerClassName?: string;
};

export type DataTableRow = {
    key: string | number;
    cells: React.ReactNode[];
    rowClassName?: string;
};

type DataTableProps = {
    columns: DataTableColumn[];
    rows: DataTableRow[];
    emptyMessage: string;
    emptyColSpan?: number;
    footer?: React.ReactNode;
    wrapperClassName?: string;
    maxVisibleRows?: number;
    rowHeightPx?: number;
    headerHeightPx?: number;
};

export default function DataTable({
    columns,
    rows,
    emptyMessage,
    emptyColSpan,
    footer,
    wrapperClassName = "overflow-x-auto border rounded-lg shadow-sm",
    maxVisibleRows,
    rowHeightPx = 56,
    headerHeightPx = 52,
}: DataTableProps) {
    const computedMaxHeight =
        typeof maxVisibleRows === "number" && maxVisibleRows > 0
            ? `${headerHeightPx + rowHeightPx * maxVisibleRows}px`
            : undefined;

    return (
        <div className={wrapperClassName} style={computedMaxHeight ? { maxHeight: computedMaxHeight, overflowY: "auto" } : undefined}>
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-100 border-b">
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} className={column.headerClassName || "p-3"}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length > 0 ? (
                        rows.map((row) => (
                            <tr key={row.key} className={row.rowClassName || "border-b hover:bg-gray-50"}>
                                {row.cells.map((cell, idx) => (
                                    <td key={`${row.key}-${idx}`} className="p-3">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={emptyColSpan || columns.length} className="p-6 text-center text-gray-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
                {footer && <tfoot className="bg-gray-50 border-t font-semibold">{footer}</tfoot>}
            </table>
        </div>
    );
}
