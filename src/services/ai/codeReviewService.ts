import { ServiceResponse } from '../types/services';

// AI Code Review Configuration
export interface AICodeReviewConfig {
  provider: 'openai' | 'anthropic' | 'openrouter';
  model: string;
  temperature: number;
  maxTokens: number;
  reviewCriteria: ReviewCriteria[];
}

export interface ReviewCriteria {
  category: 'functionality' | 'code-quality' | 'best-practices' | 'security' | 'performance';
  weight: number;
  description: string;
}

export interface CodeSubmission {
  id: string;
  userId: string;
  challengeId: string;
  code: string;
  language: string;
  description?: string;
  submittedAt: Date;
}

export interface AICodeReview {
  id: string;
  submissionId: string;
  overallScore: number; // 0-100
  feedback: ReviewFeedback[];
  suggestions: CodeSuggestion[];
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
  estimatedSkillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  reviewedAt: Date;
  reviewTimeMs: number;
}

export interface ReviewFeedback {
  category: ReviewCriteria['category'];
  score: number; // 0-100
  message: string;
  severity: 'info' | 'warning' | 'error';
  lineNumber?: number;
  codeSnippet?: string;
}

export interface CodeSuggestion {
  type: 'improvement' | 'alternative' | 'optimization' | 'fix';
  title: string;
  description: string;
  originalCode?: string;
  suggestedCode?: string;
  impact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'challenging';
}

// Default configuration
const DEFAULT_CONFIG: AICodeReviewConfig = {
  provider: 'openrouter',
  // Use a cost-effective/free default model aligned with our plan;
  // can be overridden via env: OPENROUTER_MODEL
  model: process.env.OPENROUTER_MODEL || 'google/gemini-flash-1.5',
  temperature: 0.3,
  maxTokens: 2000,
  reviewCriteria: [
    {
      category: 'functionality',
      weight: 0.3,
      description: 'Does the code work correctly and meet requirements?'
    },
    {
      category: 'code-quality',
      weight: 0.25,
      description: 'Is the code clean, readable, and well-structured?'
    },
    {
      category: 'best-practices',
      weight: 0.2,
      description: 'Does the code follow language and framework best practices?'
    },
    {
      category: 'security',
      weight: 0.15,
      description: 'Are there any security vulnerabilities or concerns?'
    },
    {
      category: 'performance',
      weight: 0.1,
      description: 'Is the code efficient and performant?'
    }
  ]
};

/**
 * AI Code Review Service
 * Provides automated code review using AI models
 */
export class AICodeReviewService {
  private config: AICodeReviewConfig;
  private apiKey: string;

  constructor(config: Partial<AICodeReviewConfig> = {}, apiKey?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
  }

  /**
   * Review code submission using AI
   */
  async reviewCode(submission: CodeSubmission): Promise<ServiceResponse<AICodeReview>> {
    const startTime = Date.now();

    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'AI service not configured. API key missing.'
        };
      }

      const prompt = this.buildReviewPrompt(submission);
      const aiResponse = await this.callAIService(prompt);
      
      if (!aiResponse.success || !aiResponse.data) {
        return {
          success: false,
          error: aiResponse.error || 'Failed to get AI response'
        };
      }

      const review = this.parseAIResponse(aiResponse.data, submission);
      review.reviewTimeMs = Date.now() - startTime;

      return {
        success: true,
        data: review
      };
    } catch (error) {
      console.error('AI code review error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Build review prompt for AI
   */
  private buildReviewPrompt(submission: CodeSubmission): string {
    const criteriaText = this.config.reviewCriteria
      .map(c => `- ${c.category} (${Math.round(c.weight * 100)}%): ${c.description}`)
      .join('\n');

    return `
You are an expert code reviewer providing constructive feedback for a coding challenge submission.

**Code Submission:**
Language: ${submission.language}
Description: ${submission.description || 'No description provided'}

\`\`\`${submission.language}
${submission.code}
\`\`\`

**Review Criteria:**
${criteriaText}

**Instructions:**
1. Analyze the code against each criterion and provide a score (0-100)
2. Give specific, actionable feedback
3. Highlight both strengths and areas for improvement
4. Suggest concrete next steps for learning
5. Estimate the developer's skill level
6. Be encouraging while being honest about areas needing work

**Response Format (JSON):**
{
  "overallScore": number,
  "feedback": [
    {
      "category": "functionality|code-quality|best-practices|security|performance",
      "score": number,
      "message": "detailed feedback",
      "severity": "info|warning|error",
      "lineNumber": number (optional),
      "codeSnippet": "relevant code" (optional)
    }
  ],
  "suggestions": [
    {
      "type": "improvement|alternative|optimization|fix",
      "title": "suggestion title",
      "description": "detailed description",
      "originalCode": "current code" (optional),
      "suggestedCode": "improved code" (optional),
      "impact": "low|medium|high",
      "difficulty": "easy|moderate|challenging"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"],
  "nextSteps": ["step 1", "step 2"],
  "estimatedSkillLevel": "beginner|intermediate|advanced|expert"
}
`;
  }

  /**
   * Call AI service API
   */
  private async callAIService(prompt: string): Promise<ServiceResponse<string>> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://tradeya.app',
          'X-Title': 'TradeYa Code Review'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in AI response');
      }

      return {
        success: true,
        data: content
      };
    } catch (error) {
      console.error('AI service call error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service call failed'
      };
    }
  }

  /**
   * Parse AI response into structured review
   */
  private parseAIResponse(aiResponse: string, submission: CodeSubmission): AICodeReview {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        id: `review_${submission.id}_${Date.now()}`,
        submissionId: submission.id,
        overallScore: parsed.overallScore || 0,
        feedback: parsed.feedback || [],
        suggestions: parsed.suggestions || [],
        strengths: parsed.strengths || [],
        areasForImprovement: parsed.areasForImprovement || [],
        nextSteps: parsed.nextSteps || [],
        estimatedSkillLevel: parsed.estimatedSkillLevel || 'beginner',
        reviewedAt: new Date(),
        reviewTimeMs: 0 // Will be set by caller
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback review if parsing fails
      return {
        id: `review_${submission.id}_${Date.now()}`,
        submissionId: submission.id,
        overallScore: 50,
        feedback: [
          {
            category: 'functionality',
            score: 50,
            message: 'Unable to analyze code automatically. Please request manual review.',
            severity: 'warning'
          }
        ],
        suggestions: [],
        strengths: ['Code submitted successfully'],
        areasForImprovement: ['Request manual review for detailed feedback'],
        nextSteps: ['Continue practicing', 'Seek mentor guidance'],
        estimatedSkillLevel: 'beginner',
        reviewedAt: new Date(),
        reviewTimeMs: 0
      };
    }
  }

  /**
   * Get review summary for display
   */
  getReviewSummary(review: AICodeReview): string {
    const scoreEmoji = review.overallScore >= 80 ? '🎉' : 
                      review.overallScore >= 60 ? '👍' : 
                      review.overallScore >= 40 ? '📈' : '💪';

    return `${scoreEmoji} Overall Score: ${review.overallScore}/100 (${review.estimatedSkillLevel} level)`;
  }

  /**
   * Check if AI service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      if (!this.apiKey) return false;
      
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const aiCodeReviewService = new AICodeReviewService();
