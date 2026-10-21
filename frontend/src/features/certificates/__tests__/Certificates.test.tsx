import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CertificatesPage } from '../CertificatesPage';
import { VerifyCertificatePage } from '../VerifyCertificatePage';
import { certificatesApi } from '../../../api/certificates';
import { enrollmentApi } from '../../../api/enrollments';
import { apiError, renderWithProviders } from '../../../test/render';
import type { Certificate, Enrollment } from '../../../types';

vi.mock('../../../api/certificates', () => ({
  certificatesApi: { getMyCertificates: vi.fn(), claimCourseCertificate: vi.fn(), verify: vi.fn() },
}));
vi.mock('../../../api/enrollments', () => ({ enrollmentApi: { getMyEnrollments: vi.fn() } }));
const certs = vi.mocked(certificatesApi);
const enrollments = vi.mocked(enrollmentApi);

const certificate: Certificate = {
  id: 'c1', student: 'u1', student_name: 'S T', course: 'course-done', course_title: 'Finished Course',
  instructor_name: 'Prof', verification_code: 'CERT-ABC123', issued_at: '2026-10-20T10:00:00Z',
};
const enrollment = (course: string, title: string) =>
  ({ id: `e-${course}`, course, status: 'ACTIVE', course_detail: { title } }) as unknown as Enrollment;

describe('CertificatesPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lists earned certificates and only offers claims for other courses', async () => {
    certs.getMyCertificates.mockResolvedValue([certificate]);
    enrollments.getMyEnrollments.mockResolvedValue([
      enrollment('course-done', 'Finished Course'),
      enrollment('course-open', 'Open Course'),
    ]);
    renderWithProviders(<CertificatesPage />, { route: '/certificates', path: '/certificates' });

    expect(await screen.findByText('CERT-ABC123')).toBeInTheDocument();
    expect(await screen.findByText('Open Course')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /claim certificate/i })).toHaveLength(1);
  });

  it('explains which criteria are missing when a claim is refused', async () => {
    certs.getMyCertificates.mockResolvedValue([]);
    enrollments.getMyEnrollments.mockResolvedValue([enrollment('course-open', 'Open Course')]);
    certs.claimCourseCertificate.mockRejectedValue(
      Object.assign(apiError(400, 'Course completion criteria have not been satisfied.', 'CRITERIA_NOT_MET'), {
        response: {
          status: 400,
          data: {
            code: 'CRITERIA_NOT_MET',
            details: {
              eligible: false, total_lessons: 4, completed_lessons: 1, total_quizzes: 1, quizzes_passed: 0,
              missing_quizzes: [{ quiz_id: 'q1', title: 'Final Quiz', pass_percentage: 70 }],
            },
          },
        },
      })
    );
    renderWithProviders(<CertificatesPage />, { route: '/certificates', path: '/certificates' });

    await userEvent.click(await screen.findByRole('button', { name: /claim certificate/i }));
    expect(await screen.findByText('Not eligible yet')).toBeInTheDocument();
    expect(screen.getByText('Lessons completed: 1 / 4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Final Quiz' })).toHaveAttribute('href', '/quizzes/q1');
    expect(certs.claimCourseCertificate).toHaveBeenCalledWith('course-open');
  });
});

describe('VerifyCertificatePage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows the limited public details of a valid certificate without signing in', async () => {
    certs.verify.mockResolvedValue({
      valid: true, verification_code: 'CERT-ABC123', course_title: 'Finished Course',
      student_name: 'S T', instructor_name: 'Prof', issued_at: '2026-10-20T10:00:00Z',
    });
    renderWithProviders(<VerifyCertificatePage />, { route: '/verify/CERT-ABC123', path: '/verify/:code', user: null });

    expect(await screen.findByTestId('verify-valid')).toHaveTextContent('Finished Course');
    expect(certs.verify).toHaveBeenCalledWith('CERT-ABC123');
  });

  it('reports unknown codes', async () => {
    certs.verify.mockRejectedValue(apiError(404, 'Certificate not found or invalid verification code.', 'CERTIFICATE_NOT_FOUND'));
    renderWithProviders(<VerifyCertificatePage />, { route: '/verify/NOPE', path: '/verify/:code', user: null });
    expect(await screen.findByText('No certificate matches this code')).toBeInTheDocument();
  });
});
