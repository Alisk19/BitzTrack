import { getCollectionDocs, subscribeToCollection } from './firestore';

const filterByDateRange = (data: any[], dateField: string, range: string) => {
    if (range === 'Default') return data;

    const now = new Date();
    let pastDate = new Date();

    switch (range) {
        case 'Past 7 Days': pastDate.setDate(now.getDate() - 7); break;
        case 'Last Month': pastDate.setMonth(now.getMonth() - 1); break;
        case 'Last 3 Months': pastDate.setMonth(now.getMonth() - 3); break;
        case '6 Months': pastDate.setMonth(now.getMonth() - 6); break;
        case 'Last Year': pastDate.setFullYear(now.getFullYear() - 1); break;
        default: return data;
    }

    return data.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= pastDate && itemDate <= now;
    });
};

export const computeDashboardStats = (orders: any[], customers: any[], materials: any[], range: string) => {
    const filteredOrders = filterByDateRange(orders, 'createdAt', range);

    // Summary
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
    const pendingOrders = filteredOrders.filter(o => o.productionStatus !== 'Delivered' && o.productionStatus !== 'Completed').length;
    const totalCustomers = customers.length; // usually not date filtered

    // Revenue Chart
    const revenueByDate: Record<string, number> = {};
    filteredOrders.forEach(order => {
        const dateStr = order.createdAt ? order.createdAt.split('T')[0] : '';
        if (!dateStr) return;
        revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + (Number(order.totalAmount) || 0);
    });

    const revenueChart = Object.keys(revenueByDate).sort().map(date => ({
        date,
        revenue: revenueByDate[date]
    }));

    // Orders Count Chart
    const statusCounts: Record<string, number> = {
        'Designing': 0,
        'Processing': 0,
        'Completed': 0,
        'Delivered': 0
    };
    filteredOrders.forEach(order => {
        let status = order.productionStatus || 'Designing';
        if (status === 'Ready') status = 'Completed'; // Migrate any old 'Ready'
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const ordersCountChart = Object.keys(statusCounts).map(name => ({
        name,
        value: statusCounts[name]
    }));

    // Materials Pie Chart
    const materialValues: Record<string, number> = {};
    materials.forEach(mat => {
        // Assuming materials have quantity and maybe price? 
        // In old code, we don't know the exact logic, but it was grouped by materialType
        // Assuming materials have quantity and unitCost
        const type = mat.materialType || 'Other';
        const val = (Number(mat.quantity) || 0) * (Number(mat.unitCost) || Number(mat.price) || 100);
        materialValues[type] = (materialValues[type] || 0) + val;
    });
    const rawMaterialsPieChart = Object.keys(materialValues).map(name => ({
        name,
        value: materialValues[name]
    })).sort((a, b) => b.value - a.value).slice(0, 4);

    return {
        summary: { totalOrders, totalRevenue, totalCustomers, pendingOrders },
        revenueChart,
        ordersCountChart,
        rawMaterialsPieChart
    };
};
