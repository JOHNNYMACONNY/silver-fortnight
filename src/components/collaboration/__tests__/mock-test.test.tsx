// Simple test to check if the mocking works
import { submitRoleApplication } from '../../../services/roleApplications';

jest.mock('../../../services/roleApplications', () => ({
  submitRoleApplication: jest.fn(),
}));

const mockSubmitRoleApplication = submitRoleApplication as jest.MockedFunction<typeof submitRoleApplication>;

describe('Mock test', () => {
  it('should work', async () => {
    mockSubmitRoleApplication.mockResolvedValue({
      success: true,
      data: { id: 'test' } as any
    });

    const result = await submitRoleApplication('test', 'test', 'test', { message: 'test' });
    expect(result.success).toBe(true);
    expect(mockSubmitRoleApplication).toHaveBeenCalled();
  });
});
