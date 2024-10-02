import { getCurrentUser } from '@/app/_actions/_actions';
import { useQuery } from '@tanstack/react-query';

export const useAuthUser = (publicKey: string | null) => {

    return useQuery({
        queryKey: ['authUser', publicKey?.toString()],
        queryFn: () => getCurrentUser(publicKey!),
        enabled: !!publicKey,
        retry: 2,
        staleTime: 60000,
    }
    );
};