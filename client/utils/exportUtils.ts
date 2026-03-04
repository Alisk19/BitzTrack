export const exportToCSV = (filename: string, rows: object[]) => {
    if (!rows || !rows.length) {
        alert("No data to export");
        return;
    }

    const separator = ',';
    const keys = Object.keys(rows[0]);

    // Create header row
    const csvContent =
        keys.join(separator) +
        '\n' +
        rows.map((row: any) => {
            return keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                // Escape quotes and wrap in quotes if there's a comma
                cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
                if (cell.includes(separator) || cell.includes('"') || cell.includes('\n')) {
                    cell = `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(separator);
        }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
