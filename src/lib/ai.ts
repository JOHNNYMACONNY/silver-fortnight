import { HfInference } from '@huggingface/inference';
import { Challenge } from '../types';

// Initialize Hugging Face client
const API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
if (!API_KEY) {
  console.error('Missing Hugging Face API key');
}

const hf = new HfInference(API_KEY);

// Use a free model that's good for text generation
const MODEL_ID = 'google/flan-t5-base';

// Helper to validate challenge structure
function validateChallenge(challenge: any): challenge is Partial<Challenge> {
  const isValid = (
    typeof challenge?.title === 'string' &&
    typeof challenge?.description === 'string' &&
    Array.isArray(challenge?.requirements) &&
    challenge?.requirements.every((req: any) => 
      typeof req?.type === 'string' &&
      typeof req?.count === 'number'
    ) &&
    typeof challenge?.rewards?.xp === 'number'
  );

  if (!isValid) {
    console.error('Challenge validation failed:', {
      hasTitle: typeof challenge?.title === 'string',
      hasDescription: typeof challenge?.description === 'string',
      hasRequirements: Array.isArray(challenge?.requirements),
      requirementsValid: challenge?.requirements?.every((req: any) => 
        typeof req?.type === 'string' && typeof req?.count === 'number'
      ),
      hasRewards: typeof challenge?.rewards?.xp === 'number'
    });
  }

  return isValid;
}

export async function generateAIChallenge(type: 'weekly' | 'monthly'): Promise<Partial<Challenge>> {
  console.log('Starting AI challenge generation...', {
    type,
    apiKey: API_KEY ? 'Present' : 'Missing',
    model: MODEL_ID,
    timestamp: new Date().toISOString()
  });

  try {
    const prompt = `Generate a ${type} challenge for a skill-trading platform.
    
    Format the response as a JSON object with:
    - title: engaging title
    - description: motivating description
    - requirements: achievable within ${type === 'weekly' ? '7 days' : 'a month'}
    - xp rewards: ${type === 'weekly' ? '100-300' : '500-1000'}

    Example format:
    {
      "title": "Challenge Title",
      "description": "Challenge Description",
      "type": "${type}",
      "requirements": [
        {
          "type": "trades",
          "count": 2,
          "skillCategory": "optional category"
        }
      ],
      "rewards": {
        "xp": 200,
        "badge": "optional_badge_id"
      }
    }`;

    console.log('Sending request to Hugging Face API...', {
      model: MODEL_ID,
      maxTokens: 500,
      temperature: 0.7
    });

    const response = await hf.textGeneration({
      model: MODEL_ID,
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        do_sample: true
      }
    });

    console.log('Received response from Hugging Face API:', {
      responseLength: response.generated_text.length,
      timestamp: new Date().toISOString()
    });

    // Extract JSON from response (handle potential extra text)
    const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response.generated_text);
      throw new Error('Invalid response format');
    }

    let challenge: any;
    try {
      challenge = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed challenge JSON:', challenge);
    } catch (parseError) {
      console.error('Failed to parse challenge JSON:', {
        error: parseError,
        rawText: response.generated_text,
        jsonAttempt: jsonMatch[0]
      });
      throw new Error('Invalid JSON response from API');
    }
    
    if (!validateChallenge(challenge)) {
      console.error('Generated challenge failed validation:', challenge);
      throw new Error('Generated challenge has invalid structure');
    }

    // Add required fields
    const fullChallenge: Partial<Challenge> = {
      ...challenge,
      type,
      status: 'pending',
      participants: [],
      completions: []
    };

    console.log('Successfully generated challenge:', fullChallenge);
    return fullChallenge;
  } catch (error) {
    console.error('Failed to generate AI challenge:', {
      error,
      type,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Failed to generate challenge. Please try again or create one manually.');
  }
}

export async function improveDescription(description: string): Promise<string> {
  console.log('Improving challenge description...', {
    originalLength: description.length,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await hf.textGeneration({
      model: MODEL_ID,
      inputs: `Improve this challenge description to be more engaging and motivating:
        "${description}"
        
        Make it:
        - Concise but impactful
        - Focus on value and learning
        - Use active voice
        - Be positive and encouraging
        
        Respond with ONLY the improved description, no additional text.`,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        do_sample: true
      }
    });

    const improvedDescription = response.generated_text.trim();
    console.log('Successfully improved description:', {
      originalLength: description.length,
      improvedLength: improvedDescription.length,
      timestamp: new Date().toISOString()
    });

    return improvedDescription;
  } catch (error) {
    console.error('Failed to improve description:', {
      error,
      originalDescription: description,
      timestamp: new Date().toISOString()
    });
    return description;
  }
}

export async function suggestRequirements(type: 'weekly' | 'monthly', description: string): Promise<Challenge['requirements']> {
  console.log('Generating requirements suggestions...', {
    type,
    descriptionLength: description.length,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await hf.textGeneration({
      model: MODEL_ID,
      inputs: `Based on this challenge description:
        "${description}"
        
        Generate requirements for a ${type} challenge.
        Respond with ONLY valid JSON array in this exact format:
        [
          {
            "type": "trades",
            "count": 2,
            "skillCategory": "optional category"
          }
        ]
        
        Requirements must be:
        - Realistic and achievable
        - Aligned with challenge goals
        - Appropriate for ${type} timeframe`,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
        do_sample: true
      }
    });

    // Extract JSON from response
    const jsonMatch = response.generated_text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', response.generated_text);
      throw new Error('Invalid response format');
    }

    let requirements: any;
    try {
      requirements = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse requirements JSON:', {
        error: parseError,
        rawText: response.generated_text,
        jsonAttempt: jsonMatch[0]
      });
      throw new Error('Invalid JSON response from API');
    }

    if (!Array.isArray(requirements)) {
      console.error('Invalid requirements format:', requirements);
      throw new Error('Invalid requirements format');
    }

    // Validate each requirement
    requirements.forEach((req, index) => {
      if (!req.type || !req.count) {
        console.error(`Invalid requirement at index ${index}:`, req);
        throw new Error(`Invalid requirement format at index ${index}`);
      }
    });

    console.log('Successfully generated requirements:', requirements);
    return requirements;
  } catch (error) {
    console.error('Failed to suggest requirements:', {
      error,
      type,
      description,
      timestamp: new Date().toISOString()
    });
    return [{ type: 'trades', count: 1 }];
  }
}