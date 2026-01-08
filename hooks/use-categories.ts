import { api } from '@/services/api';
import { Category } from '@/types';
import { useCallback, useState } from 'react';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getCategories();
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: Parameters<typeof api.createCategory>[0]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.createCategory(data);
      if (response.category) {
        setCategories(prev => [...prev, response.category]);
        return response.category;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: Parameters<typeof api.updateCategory>[1]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.updateCategory(id, data);
      if (response.category) {
        setCategories(prev => 
          prev.map(cat => cat.id === id ? response.category : cat)
        );
        return response.category;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };
}
