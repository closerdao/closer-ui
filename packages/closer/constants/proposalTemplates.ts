export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  fields: {
    title: string;
    description: string;
    rationale: string;
    impact: string;
    requestedResources: string;
    executionPlan: string;
  };
}

export const proposalTemplates: ProposalTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Proposal',
    description: 'A comprehensive proposal with all standard fields',
    fields: {
      title: '# [Proposal Title]\n\n',
      description: '## Description\n\n[Provide a clear and concise description of what this proposal aims to achieve]\n\n',
      rationale: '## Rationale\n\n[Explain why this proposal is needed. What problem does it solve? What opportunity does it create?]\n\n',
      impact: '## Impact\n\n[Describe the expected impact of this proposal. Who will benefit? What changes will occur?]\n\n',
      requestedResources: '## Requested Resources\n\n[Detail what resources are needed to implement this proposal:\n- Budget requirements\n- Human resources\n- Time commitments\n- Other resources]\n\n',
      executionPlan: '## Execution Plan\n\n[Outline how this proposal will be implemented:\n- Timeline\n- Key milestones\n- Responsibilities\n- Success metrics]\n\n'
    }
  },
  {
    id: 'budget',
    name: 'Budget Proposal',
    description: 'A proposal focused on budget allocation and financial resources',
    fields: {
      title: '# [Budget Proposal Title]\n\n',
      description: '## Description\n\n[Describe the budget allocation or financial request]\n\n',
      rationale: '## Rationale\n\n[Explain why this budget allocation is necessary and how it aligns with community goals]\n\n',
      impact: '## Impact\n\n[Describe the financial impact and expected return on investment]\n\n',
      requestedResources: '## Budget Breakdown\n\n[Detailed breakdown of requested funds:\n- Item 1: $X\n- Item 2: $Y\n- Total: $Z]\n\n',
      executionPlan: '## Implementation Timeline\n\n[When and how the budget will be used:\n- Q1: [activities]\n- Q2: [activities]\n- etc.]\n\n'
    }
  },
  {
    id: 'policy',
    name: 'Policy Proposal',
    description: 'A proposal for creating or modifying community policies',
    fields: {
      title: '# [Policy Proposal Title]\n\n',
      description: '## Description\n\n[Describe the policy change or new policy being proposed]\n\n',
      rationale: '## Rationale\n\n[Explain why this policy is needed and what problem it addresses]\n\n',
      impact: '## Impact\n\n[Describe how this policy will affect the community and its members]\n\n',
      requestedResources: '## Resources Required\n\n[What resources are needed to implement and enforce this policy:\n- Administrative resources\n- Communication needs\n- Training requirements]\n\n',
      executionPlan: '## Implementation Plan\n\n[How this policy will be implemented:\n- Rollout timeline\n- Communication strategy\n- Enforcement mechanisms]\n\n'
    }
  },
  {
    id: 'project',
    name: 'Project Proposal',
    description: 'A proposal for a specific project or initiative',
    fields: {
      title: '# [Project Proposal Title]\n\n',
      description: '## Project Description\n\n[Describe the project, its goals, and expected outcomes]\n\n',
      rationale: '## Why This Project?\n\n[Explain why this project is important and how it fits with community objectives]\n\n',
      impact: '## Expected Impact\n\n[Describe the benefits and outcomes this project will deliver]\n\n',
      requestedResources: '## Resources Needed\n\n[Detail all resources required:\n- Budget: $X\n- Team members: [roles]\n- Timeline: [duration]\n- Equipment/materials: [list]]\n\n',
      executionPlan: '## Project Plan\n\n[Detailed implementation plan:\n- Phase 1: [description and timeline]\n- Phase 2: [description and timeline]\n- Phase 3: [description and timeline]\n- Success metrics: [how to measure success]]\n\n'
    }
  },
  {
    id: 'simple',
    name: 'Simple Proposal',
    description: 'A basic proposal with minimal structure',
    fields: {
      title: '# [Simple Proposal Title]\n\n',
      description: '## What?\n\n[What are you proposing?]\n\n',
      rationale: '## Why?\n\n[Why is this needed?]\n\n',
      impact: '## Impact\n\n[What will this achieve?]\n\n',
      requestedResources: '## Resources\n\n[What do you need?]\n\n',
      executionPlan: '## How?\n\n[How will you do it?]\n\n'
    }
  }
];

export const getTemplateById = (id: string): ProposalTemplate | undefined => {
  return proposalTemplates.find(template => template.id === id);
};

export const getTemplateFields = (id: string): ProposalTemplate['fields'] | null => {
  const template = getTemplateById(id);
  return template ? template.fields : null;
};
