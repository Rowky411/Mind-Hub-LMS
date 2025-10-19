/**
 * Component tests for EnrollButton component
 *
 * Tests:
 * - Renders "Enroll" button for non-enrolled students
 * - Renders "Enrolled" state for enrolled students
 * - Handles enrollment action on click
 * - Shows loading state during enrollment
 * - Displays error message on enrollment failure
 * - Handles enrollment capacity full scenario
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EnrollButton from '@/components/enrollments/EnrollButton';
import * as enrollmentsApi from '@/api/enrollments';

// Mock the enrollments API
vi.mock('@/api/enrollments');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('EnrollButton', () => {
  const mockCourseId = '123e4567-e89b-12d3-a456-426614174000';
  const mockEnrollmentId = '987fcdeb-51a2-43f8-9012-345678901234';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Enroll" button when student is not enrolled', () => {
    render(
      <EnrollButton courseId={mockCourseId} isEnrolled={false} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /enroll/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders "Enrolled" state when student is enrolled', () => {
    render(
      <EnrollButton
        courseId={mockCourseId}
        isEnrolled={true}
        enrollmentId={mockEnrollmentId}
      />,
      { wrapper: createWrapper() }
    );

    // Should show "Enrolled" or a checkmark indicator
    expect(screen.getByText(/enrolled/i)).toBeInTheDocument();
  });

  it('calls enrollInCourse API when enroll button is clicked', async () => {
    const user = userEvent.setup();
    const mockEnrollInCourse = vi.spyOn(enrollmentsApi, 'enrollInCourse');
    mockEnrollInCourse.mockResolvedValue({
      id: mockEnrollmentId,
      student_id: 'student-id',
      course_id: mockCourseId,
      enrollment_date: new Date().toISOString(),
      completion_percentage: 0,
      is_completed: false,
      is_active: true,
    });

    render(
      <EnrollButton courseId={mockCourseId} isEnrolled={false} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /enroll/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockEnrollInCourse).toHaveBeenCalledWith(mockCourseId);
    });
  });

  it('shows loading state during enrollment', async () => {
    const user = userEvent.setup();
    const mockEnrollInCourse = vi.spyOn(enrollmentsApi, 'enrollInCourse');

    // Create a promise that we can control
    let resolveEnrollment: (value: any) => void;
    const enrollmentPromise = new Promise((resolve) => {
      resolveEnrollment = resolve;
    });

    mockEnrollInCourse.mockReturnValue(enrollmentPromise as any);

    render(
      <EnrollButton courseId={mockCourseId} isEnrolled={false} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /enroll/i });
    await user.click(button);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/enrolling/i)).toBeInTheDocument();
    });

    // Resolve the promise
    resolveEnrollment!({
      id: mockEnrollmentId,
      student_id: 'student-id',
      course_id: mockCourseId,
      enrollment_date: new Date().toISOString(),
      completion_percentage: 0,
      is_completed: false,
      is_active: true,
    });
  });

  it('disables button during enrollment', async () => {
    const user = userEvent.setup();
    const mockEnrollInCourse = vi.spyOn(enrollmentsApi, 'enrollInCourse');

    let resolveEnrollment: (value: any) => void;
    const enrollmentPromise = new Promise((resolve) => {
      resolveEnrollment = resolve;
    });

    mockEnrollInCourse.mockReturnValue(enrollmentPromise as any);

    render(
      <EnrollButton courseId={mockCourseId} isEnrolled={false} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /enroll/i });
    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    resolveEnrollment!({
      id: mockEnrollmentId,
      student_id: 'student-id',
      course_id: mockCourseId,
      enrollment_date: new Date().toISOString(),
      completion_percentage: 0,
      is_completed: false,
      is_active: true,
    });
  });

  it('displays error message when enrollment fails', async () => {
    const user = userEvent.setup();
    const mockEnrollInCourse = vi.spyOn(enrollmentsApi, 'enrollInCourse');
    mockEnrollInCourse.mockRejectedValue({
      response: {
        data: { detail: 'Course is at full capacity' },
      },
    });

    render(
      <EnrollButton courseId={mockCourseId} isEnrolled={false} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /enroll/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/course is at full capacity/i)).toBeInTheDocument();
    });
  });

  it('displays generic error when enrollment fails without detail', async () => {
    const user = userEvent.setup();
    const mockEnrollInCourse = vi.spyOn(enrollmentsApi, 'enrollInCourse');
    mockEnrollInCourse.mockRejectedValue(new Error('Network error'));

    render(
      <EnrollButton courseId={mockCourseId} isEnrolled={false} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /enroll/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to enroll/i)).toBeInTheDocument();
    });
  });

  it('shows success message after successful enrollment', async () => {
    const user = userEvent.setup();
    const mockEnrollInCourse = vi.spyOn(enrollmentsApi, 'enrollInCourse');
    mockEnrollInCourse.mockResolvedValue({
      id: mockEnrollmentId,
      student_id: 'student-id',
      course_id: mockCourseId,
      enrollment_date: new Date().toISOString(),
      completion_percentage: 0,
      is_completed: false,
      is_active: true,
    });

    render(
      <EnrollButton courseId={mockCourseId} isEnrolled={false} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /enroll/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/successfully enrolled/i)).toBeInTheDocument();
    });
  });

  it('does not allow enrollment when already enrolled', () => {
    render(
      <EnrollButton
        courseId={mockCourseId}
        isEnrolled={true}
        enrollmentId={mockEnrollmentId}
      />,
      { wrapper: createWrapper() }
    );

    // Enrolled state should not have an enroll button
    const enrollButton = screen.queryByRole('button', { name: /^enroll$/i });
    expect(enrollButton).not.toBeInTheDocument();
  });
});
