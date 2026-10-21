import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { certificatesApi } from '../../api/certificates';

export const certificateKeys = {
  mine: ['certificates', 'me'] as const,
  verify: (code: string) => ['certificates', 'verify', code] as const,
};

export function useMyCertificates() {
  return useQuery({ queryKey: certificateKeys.mine, queryFn: () => certificatesApi.getMyCertificates() });
}

export function useClaimCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => certificatesApi.claimCourseCertificate(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: certificateKeys.mine }),
  });
}

export function useVerifyCertificate(code: string | undefined) {
  return useQuery({
    queryKey: certificateKeys.verify(code ?? ''),
    queryFn: () => certificatesApi.verify(code!),
    enabled: !!code,
    retry: false,
  });
}
