import { getProfile, getUsers, login, updateProfile } from '@/services/api/auth.api';
import { LoginCredentials, UpdateProfileData } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';

export function useUsersQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.auth.users,
        queryFn: getUsers,
    });
}

export function useProfileQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.auth.profile,
        queryFn: getProfile,
    });
}

export function useLoginMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => login(credentials),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profile });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.users });
        },
    });
}

export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateProfileData) => updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profile });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.users });
        },
    });
}
