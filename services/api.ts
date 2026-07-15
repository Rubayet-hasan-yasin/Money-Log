import { axiosInstance, tokenManager } from './axios-instance';
import { authApi } from './auth.api';
import { categoriesApi } from './categories.api';
import { walletsApi } from './wallets.api';
import { expensesApi } from './expenses.api';
import { dashboardApi } from './dashboard.api';
import { healthApi } from './health.api';


export const api = {
    axiosInstance,
    ...tokenManager,
    ...authApi,
    ...categoriesApi,
    ...walletsApi,
    ...expensesApi,
    ...dashboardApi,
    ...healthApi,
};
