// Demo Data: Three-Tier Challenge Examples
// This file contains realistic examples of how challenges work across all three tiers

export const demoSoloChallenges = [
  {
    id: 'solo-react-hooks',
    type: 'SOLO',
    title: 'Master React Hooks in 7 Days',
    description: 'Build three progressive mini-projects while learning useState, useEffect, and custom hooks',
    skills: ['React', 'JavaScript', 'Frontend Development'],
    difficulty: 'beginner',
    duration: '1 week',
    estimatedHours: 8,
    config: {
      deliverables: [
        'Day 1-2: Todo app with useState and event handling',
        'Day 3-4: Weather app with useEffect and API calls', 
        'Day 5-7: Form validation with custom useForm hook'
      ],
      aiMentor: {
        enabled: true,
        personalityType: 'encouraging',
        checkInFrequency: 'daily',
        feedbackAreas: ['code quality', 'best practices', 'debugging help']
      },
      validation: {
        type: 'ai',
        criteria: ['Functionality', 'Code Quality', 'React Best Practices', 'User Experience'],
        passingScore: 80
      },
      resources: [
        'React Official Docs - Hooks',
        'Interactive coding exercises',
        'Video tutorials for each concept',
        'Community Q&A forum'
      ]
    },
    rewards: {
      xp: 100,
      badges: ['React Rookie', 'Hook Master'],
      unlocks: ['Trade Challenges']
    }
  },

  {
    id: 'solo-figma-design',
    type: 'SOLO', 
    title: 'Design Your First Mobile App UI',
    description: 'Create a complete mobile app interface using Figma design principles',
    skills: ['UI/UX Design', 'Figma', 'Mobile Design'],
    difficulty: 'intermediate',
    duration: '2 weeks',
    estimatedHours: 12,
    config: {
      deliverables: [
        'Week 1: User research and wireframes',
        'Week 1: Design system and component library',
        'Week 2: High-fidelity mockups and prototypes',
        'Week 2: User flow documentation'
      ],
      aiMentor: {
        enabled: true,
        personalityType: 'analytical',
        checkInFrequency: 'weekly',
        feedbackAreas: ['design principles', 'usability', 'visual hierarchy']
      },
      validation: {
        type: 'peer-review',
        criteria: ['Visual Design', 'User Experience', 'Design Consistency', 'Feasibility'],
        reviewerCount: 3
      }
    },
    rewards: {
      xp: 150,
      badges: ['Design Thinker', 'Mobile UI Expert'],
      unlocks: ['Design-focused Trade Challenges']
    }
  }
];

export const demoTradeChallenges = [
  {
    id: 'trade-react-figma',
    type: 'TRADE',
    title: 'Code for Design: React ↔ Figma Exchange',
    description: 'Developer teaches React while learning UI/UX design; Designer teaches Figma while learning frontend development',
    skills: ['React', 'UI/UX Design', 'Figma', 'Frontend'],
    difficulty: 'intermediate',
    duration: '3 weeks',
    estimatedHours: 16,
    config: {
      tradeStructure: {
        participant1: {
          teaches: 'React Components & State Management',
          learns: 'UI/UX Design Principles & Figma',
          timeCommitment: '2 hours/week teaching + 2 hours/week learning',
          deliverables: ['3 React tutorial sessions', 'Component library demo']
        },
        participant2: {
          teaches: 'UI/UX Design & Figma Prototyping',
          learns: 'React Development & Frontend Best Practices',
          timeCommitment: '2 hours/week teaching + 2 hours/week learning',
          deliverables: ['Design system creation', 'Figma workshop sessions']
        }
      },
      exchangeFormat: 'skill-pairing',
      meetingStructure: {
        frequency: '2 sessions/week',
        duration: '1.5 hours each',
        format: 'video call + hands-on practice',
        schedule: 'flexible within participant availability'
      },
      projectGoal: 'Create a React component library with professional Figma designs',
      mutualDeliverable: 'Portfolio-ready project showcasing both skills'
    },
    matchingCriteria: {
      requiredSkills: {
        participant1: ['React', 'JavaScript'],
        participant2: ['Figma', 'UI/UX Design']
      },
      experienceLevel: 'intermediate',
      timeZoneCompatibility: true,
      communicationStyle: 'collaborative'
    },
    rewards: {
      xp: 250,
      badges: ['Skill Trader', 'Cross-Disciplinary Learner'],
      unlocks: ['Collaboration Challenges'],
      networkPoints: 50
    }
  },

  {
    id: 'trade-python-marketing',
    type: 'TRADE',
    title: 'Tech for Marketing: Python ↔ Digital Marketing',
    description: 'Data analyst teaches Python automation while learning digital marketing; Marketer teaches SEO/analytics while learning data science',
    skills: ['Python', 'Data Analysis', 'Digital Marketing', 'SEO'],
    difficulty: 'intermediate',
    duration: '4 weeks',
    estimatedHours: 20,
    config: {
      tradeStructure: {
        participant1: {
          teaches: 'Python Data Analysis & Automation',
          learns: 'Digital Marketing Strategy & Analytics',
          deliverables: ['Data analysis toolkit', 'Automation scripts for marketing']
        },
        participant2: {
          teaches: 'SEO Strategy & Digital Marketing',
          learns: 'Python for Data Analysis & Reporting',
          deliverables: ['Marketing campaign analysis', 'SEO audit framework']
        }
      },
      exchangeFormat: 'project-swap',
      projectGoal: 'Create data-driven marketing tools using Python',
      businessValue: 'Real-world applicable skills for both participants'
    },
    rewards: {
      xp: 300,
      badges: ['Cross-Industry Expert', 'Data-Driven Marketer'],
      unlocks: ['Advanced Collaboration Challenges']
    }
  }
];

export const demoCollaborationChallenges = [
  {
    id: 'collab-local-business',
    type: 'COLLABORATION',
    title: 'Build a Local Business Website',
    description: 'Work with a 4-person team to create a professional website for a real local business client',
    skills: ['Web Development', 'UI/UX Design', 'Project Management', 'Client Communication'],
    difficulty: 'moderate',
    duration: '6 weeks',
    estimatedHours: 40,
    config: {
      teamStructure: {
        minMembers: 3,
        maxMembers: 5,
        requiredRoles: ['Leader', 'Developer', 'Designer', 'Content Creator'],
        skillDiversity: ['Frontend Development', 'UI/UX Design', 'Content Strategy', 'Project Management'],
        teamFormation: 'skill-complementary'
      },
      projectScope: {
        complexity: 'moderate',
        duration: '6 weeks',
        realWorldImpact: true,
        clientInvolved: true,
        deliverables: [
          'Week 1: Client discovery and project planning',
          'Week 2: Design mockups and user experience flow',
          'Week 3-4: Frontend development and content creation', 
          'Week 5: Testing, refinement, and client feedback',
          'Week 6: Final delivery and project handoff'
        ]
      },
      clientDetails: {
        businessType: 'Local restaurant',
        currentSituation: 'No existing website',
        requirements: ['Menu display', 'Reservation system', 'Contact info', 'Photo gallery'],
        timeline: 'Flexible but prefers completion before busy season'
      },
      mentorship: {
        seniorDeveloperReviews: true,
        clientCommunicationGuidance: true,
        projectManagementSupport: true
      }
    },
    rewards: {
      xp: 500,
      badges: ['Team Player', 'Client Success', 'Real-World Impact'],
      portfolioCredit: true,
      networkPoints: 100,
      testimonialEligible: true
    }
  },

  {
    id: 'collab-open-source',
    type: 'COLLABORATION',
    title: 'Create an Open Source Developer Tool',
    description: 'Build and launch an open source tool that solves a real problem for developers worldwide',
    skills: ['Full Stack Development', 'Open Source', 'Documentation', 'Community Building'],
    difficulty: 'complex',
    duration: '8 weeks', 
    estimatedHours: 60,
    config: {
      teamStructure: {
        minMembers: 4,
        maxMembers: 6,
        requiredRoles: ['Leader', 'Frontend Developer', 'Backend Developer', 'DevOps', 'Community Manager'],
        skillDiversity: ['React/Vue', 'Node.js/Python', 'AWS/Docker', 'Technical Writing', 'Community Management']
      },
      projectScope: {
        complexity: 'complex',
        duration: '8 weeks',
        realWorldImpact: true,
        clientInvolved: false,
        openSource: true,
        deliverables: [
          'Week 1-2: Problem research and architecture planning',
          'Week 3-4: Core functionality development',
          'Week 5-6: Advanced features and testing',
          'Week 7: Documentation and community setup',
          'Week 8: Launch, promotion, and initial user feedback'
        ]
      },
      toolCategory: 'Developer productivity',
      successMetrics: ['GitHub stars', 'Downloads/usage', 'Community engagement', 'User feedback'],
      mentorship: {
        openSourceMaintainerGuidance: true,
        technicalArchitectureReviews: true,
        communityBuildingSupport: true
      }
    },
    rewards: {
      xp: 800,
      badges: ['Open Source Contributor', 'Community Builder', 'Innovation Leader'],
      portfolioCredit: true,
      githubRecognition: true,
      networkPoints: 200,
      industryVisibility: true
    }
  },

  {
    id: 'collab-startup-mvp',
    type: 'COLLABORATION',
    title: 'Build an MVP for a Social Impact Startup',
    description: 'Partner with a social impact startup to build their minimum viable product',
    skills: ['Startup Development', 'Full Stack', 'Product Management', 'Social Impact'],
    difficulty: 'complex',
    duration: '10 weeks',
    estimatedHours: 80,
    config: {
      teamStructure: {
        minMembers: 5,
        maxMembers: 7,
        requiredRoles: ['Leader', 'Product Manager', 'Frontend Dev', 'Backend Dev', 'Designer', 'QA'],
        skillDiversity: ['Product Strategy', 'React/Angular', 'Node.js/Django', 'UI/UX', 'Testing']
      },
      projectScope: {
        complexity: 'complex',
        duration: '10 weeks',
        realWorldImpact: true,
        clientInvolved: true,
        startupPartnership: true,
        potentialEmploymentOpportunity: true
      },
      startupDetails: {
        mission: 'Education accessibility for underserved communities',
        stage: 'Pre-seed',
        founders: 'Experienced educators with business background',
        mvpGoals: ['User authentication', 'Learning modules', 'Progress tracking', 'Community features']
      }
    },
    rewards: {
      xp: 1000,
      badges: ['Startup Builder', 'Social Impact Hero', 'MVP Creator'],
      portfolioCredit: true,
      startupEquityEligible: true,
      employmentPipeline: true,
      networkPoints: 300
    }
  }
];

// Progressive Challenge Paths
export const challengeProgressionPaths = {
  webDevelopment: {
    solo: ['solo-react-hooks', 'solo-javascript-mastery', 'solo-css-layouts'],
    trade: ['trade-react-figma', 'trade-frontend-backend'],
    collaboration: ['collab-local-business', 'collab-e-commerce-platform']
  },
  
  design: {
    solo: ['solo-figma-design', 'solo-design-systems', 'solo-user-research'],
    trade: ['trade-react-figma', 'trade-design-development'],
    collaboration: ['collab-rebrand-project', 'collab-design-system']
  },
  
  dataScience: {
    solo: ['solo-python-analysis', 'solo-machine-learning', 'solo-data-viz'],
    trade: ['trade-python-marketing', 'trade-data-business'],
    collaboration: ['collab-nonprofit-analytics', 'collab-predictive-modeling']
  },
  
  entrepreneurship: {
    solo: ['solo-business-plan', 'solo-market-research', 'solo-mvp-design'],
    trade: ['trade-tech-business', 'trade-marketing-development'],
    collaboration: ['collab-startup-mvp', 'collab-product-launch']
  }
};

// Smart Matching Algorithm Demo
export const smartMatchingExamples = {
  userProfile: {
    id: 'user123',
    skills: ['React', 'JavaScript'],
    learningGoals: ['UI/UX Design', 'Product Management'],
    experience: 'intermediate',
    availability: '8 hours/week',
    timezone: 'PST',
    completedChallenges: ['solo-react-hooks']
  },
  
  recommendations: [
    {
      challengeId: 'trade-react-figma',
      matchScore: 95,
      reasons: [
        'Perfect skill match: You know React, want to learn Design',
        'Complementary learning goals',
        'Available partners in your timezone',
        'Good experience level match'
      ]
    },
    {
      challengeId: 'collab-local-business',
      matchScore: 75,
      reasons: [
        'Your React skills are needed',
        'Opportunity to learn project management',
        'Real client experience'
      ],
      note: 'Complete one trade challenge first to unlock'
    }
  ]
};

// Example of simplified vs complex view data
export const uiComplexityExample = {
  simpleView: {
    myRole: 'Contributor',
    nextAction: 'Review mockups and give feedback',
    teammates: ['Alice (Leader)', 'Bob (Helper)'],
    progress: '60% complete',
    timeLeft: '2 weeks'
  },
  
  complexView: {
    roleDetails: {
      title: 'Frontend Development Contributor',
      permissions: ['code-review', 'pull-request', 'issue-creation'],
      responsibilities: ['Component development', 'Code review', 'Testing'],
      reportingStructure: 'Reports to Technical Lead',
      escalationPath: 'Technical Lead → Project Manager → Client'
    },
    workflowState: 'development-phase',
    taskAssignments: ['Implement user dashboard', 'Review responsive design'],
    dependencyChain: ['Waiting for API from backend team'],
    qualityGates: ['Code review required', 'Testing suite must pass']
  }
};
