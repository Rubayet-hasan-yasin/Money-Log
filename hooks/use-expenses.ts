import { api } from '@/services/api';
import { Expense, ExpenseFilters } from '@/types';
import { useCallback, useState } from 'react';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchExpenses = useCallback(async (filters: ExpenseFilters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getExpenses(filters);
      if (response.expenses) {
        if (filters.page === 1 || !filters.page) {
          setExpenses(response.expenses);
        } else {
          setExpenses(prev => [...prev, ...response.expenses]);
        }
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (data: Parameters<typeof api.createExpense>[0]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.createExpense(data);
      if (response.expense) {
        setExpenses(prev => [response.expense, ...prev]);
        return response.expense;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (id: string, data: Parameters<typeof api.updateExpense>[1]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.updateExpense(id, data);
      if (response.expense) {
        setExpenses(prev => 
          prev.map(exp => exp.id === id ? response.expense : exp)
        );
        return response.expense;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages) {
      fetchExpenses({ page: pagination.page + 1, limit: pagination.limit });
    }
  }, [pagination, fetchExpenses]);

  const refresh = useCallback(() => {
    fetchExpenses({ page: 1, limit: pagination.limit });
  }, [fetchExpenses, pagination.limit]);

  return {
    expenses,
    isLoading,
    error,
    pagination,
    hasMore: pagination.page < pagination.pages,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    loadMore,
    refresh,
  };
}
