import { baseApi } from './baseApi';
import { type DashboardStats, type RevenueData, type Activity, type Product } from './types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      // Mock data for demo
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        return {
          data: {
            newCustomers: 83,
            newCustomersGoal: 100,
            totalIncome: 680,
            incomeChange: 13,
          },
        };
      },
    }),

    getRevenueData: builder.query<RevenueData[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          data: [
            { day: 'Mon', value1: 40, value2: 80 },
            { day: 'Tue', value1: 60, value2: 95 },
            { day: 'Wed', value1: 35, value2: 75 },
            { day: 'Thu', value1: 50, value2: 100 },
            { day: 'Fri', value1: 45, value2: 85 },
            { day: 'Sat', value1: 55, value2: 95 },
            { day: 'Sun', value1: 40, value2: 80 },
            { day: 'Mon', value1: 48, value2: 90 },
          ],
        };
      },
    }),

    getActivities: builder.query<Activity[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
          data: [
            { id: '1', time: '09:46', title: 'Payment received from John Doe', amount: '$385.90', type: 'payment' },
            { id: '2', time: '09:45', title: 'New sale recorded', type: 'sale' },
            { id: '3', time: '09:40', title: 'Task completed', type: 'task' },
          ],
        };
      },
    }),

    getProducts: builder.query<Product[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return {
          data: [
            { id: '1', name: 'Minecraft App', assigned: 'John Doe', progress: 75, priority: 'High', budget: '$5,000' },
            { id: '2', name: 'E-commerce Platform', assigned: 'Jane Smith', progress: 60, priority: 'Medium', budget: '$8,500' },
            { id: '3', name: 'Mobile Banking', assigned: 'Mike Johnson', progress: 90, priority: 'High', budget: '$12,000' },
          ],
        };
      },
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetRevenueDataQuery,
  useGetActivitiesQuery,
  useGetProductsQuery,
} = dashboardApi;
