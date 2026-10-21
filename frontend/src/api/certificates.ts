import { apiClient } from './client';
import type { Certificate, CertificateVerification } from '../types';

export const certificatesApi = {
  getMyCertificates: async (): Promise<Certificate[]> => {
    const response = await apiClient.get<Certificate[]>('/certificates/me/');
    return response.data;
  },

  /** Returns the existing certificate or issues one; 400 CRITERIA_NOT_MET when not yet eligible. */
  claimCourseCertificate: async (courseId: string): Promise<Certificate> => {
    const response = await apiClient.get<Certificate>(`/courses/${courseId}/certificate/`);
    return response.data;
  },

  /** Public: no login required. 404 CERTIFICATE_NOT_FOUND for unknown codes. */
  verify: async (code: string): Promise<CertificateVerification> => {
    const response = await apiClient.get<CertificateVerification>(
      `/certificates/verify/${encodeURIComponent(code)}/`
    );
    return response.data;
  },
};
