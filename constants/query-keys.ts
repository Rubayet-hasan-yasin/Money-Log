export const QUERY_KEYS = {
    auth: {
        users: ['users'] as const,
        profile: ['profile'] as const,
    },
    expenses: {
        all: ['expenses'] as const,
        list: (filters: any) => ['expenses', 'list', filters] as const,
        details: (id: string) => ['expenses', 'detail', id] as const,
    },
    categories: {
        all: ['categories'] as const,
    },
    wallets: {
        all: ['wallets'] as const,
    },
};
