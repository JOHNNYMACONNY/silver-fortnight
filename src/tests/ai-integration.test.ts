import { describe, it, expect, vi } from 'vitest';
import { HfInference } from '@huggingface/inference';
import { generateAIChallenge, improveDescription, suggestRequirements } from '../lib/ai';

// Mock HuggingFace client
vi.mock('@huggingface/inference', () => ({
  HfInference: vi.fn(() => ({
    textGeneration: vi.fn()
  }))
}));

describe('AI Integration Tests', () => {
  // Rate limit handling tests
  describe('Rate Limit Handling', () => {
    it('should handle rate limits gracefully', async () => {
      const mockHf = new HfInference('test-key');
      vi.mocked(mockHf.textGeneration).mockRejectedValueOnce(new Error('Rate limit exceeded'));
      
      // The actual test will depend on how we implement rate limit handling
      // This is a placeholder for the test structure
    });

    it('should respect token limits', async () => {
      const mockHf = new HfInference('test-key');
      
      // Test that our prompt doesn't exceed token limits
      const result = await generateAIChallenge('weekly');
      // Add assertions based on token limit requirements
    });
  });

  // Response processing tests
  describe('Response Processing', () => {
    it('should parse JSON responses correctly', async () => {
      const mockHf = new HfInference('test-key');
      vi.mocked(mockHf.textGeneration).mockResolvedValueOnce({
        generated_text: JSON.stringify({
          title: "Test Challenge",
          description: "Test Description",
          requirements: [],
          rewards: { xp: 100 }
        })
      });

      const result = await generateAIChallenge('weekly');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
    });

    it('should handle malformed responses', async () => {
      const mockHf = new HfInference('test-key');
      vi.mocked(mockHf.textGeneration).mockResolvedValueOnce({
        generated_text: 'Invalid JSON'
      });

      await expect(generateAIChallenge('weekly')).rejects.toThrow();
    });
  });

  // Skills analysis tests
  describe('Skills Analysis', () => {
    it('should improve skill descriptions effectively', async () => {
      const mockHf = new HfInference('test-key');
      const originalDesc = "Basic web development";
      vi.mocked(mockHf.textGeneration).mockResolvedValueOnce({
        generated_text: "Professional web development with modern frameworks and responsive design"
      });

      const result = await improveDescription(originalDesc);
      expect(result).toContain('Professional');
      expect(result.length).toBeGreaterThan(originalDesc.length);
    });

    it('should suggest relevant requirements', async () => {
      const mockHf = new HfInference('test-key');
      vi.mocked(mockHf.textGeneration).mockResolvedValueOnce({
        generated_text: JSON.stringify([
          { type: "trades", count: 2, skillCategory: "web development" }
        ])
      });

      const result = await suggestRequirements('weekly', "Web development challenge");
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('count');
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockHf = new HfInference('test-key');
      vi.mocked(mockHf.textGeneration).mockRejectedValueOnce(new Error('API Error'));

      await expect(generateAIChallenge('weekly')).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const mockHf = new HfInference('test-key');
      const specificError = new Error('Invalid API key');
      vi.mocked(mockHf.textGeneration).mockRejectedValueOnce(specificError);

      try {
        await generateAIChallenge('weekly');
      } catch (error) {
        expect(error.message).toContain('Failed to generate challenge');
      }
    });
  });
});
