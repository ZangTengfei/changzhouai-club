import type { ComponentProps } from "react";
export function Table(props: ComponentProps<"table">) { return <div className="ant-table-wrapper"><div className="ant-table ant-table-bordered"><div className="ant-table-container"><div className="ant-table-content"><table {...props} /></div></div></div></div>; }
export function TableHeader(props: ComponentProps<"thead">) { return <thead className="ant-table-thead" {...props} />; }
export function TableBody(props: ComponentProps<"tbody">) { return <tbody className="ant-table-tbody" {...props} />; }
export function TableFooter(props: ComponentProps<"tfoot">) { return <tfoot {...props} />; }
export function TableRow(props: ComponentProps<"tr">) { return <tr className="ant-table-row" {...props} />; }
export function TableHead(props: ComponentProps<"th">) { return <th {...props} />; }
export function TableCell(props: ComponentProps<"td">) { return <td className="ant-table-cell" {...props} />; }
export function TableCaption(props: ComponentProps<"caption">) { return <caption {...props} />; }
