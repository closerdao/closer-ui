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
    id: 'masterplan',
    name: 'Masterplan Change',
    description: 'Changes to infrastructure, land use, or land acquisition',
    fields: {
      title: '# [Masterplan Change Title]\n\n',
      description: '## Description\n\n[Describe the proposed change to the masterplan — new infrastructure, change of land use, land acquisition, etc.]\n\n',
      rationale: '## Rationale\n\n[Why is this change needed? How does it align with TDF\'s regenerative mission and ecological principles?]\n\n',
      impact: '## Ecological & Community Impact\n\n[How will this affect the land, ecosystem, and community? Note: Guardians hold ecological veto power over land-related decisions.]\n\n',
      requestedResources: '## Resources & Budget\n\n[Detail all resources required:\n- Budget estimate\n- Materials and equipment\n- Labour / volunteer hours\n- External contractors or permits]\n\n',
      executionPlan: '## Execution Plan\n\n[Timeline and milestones:\n- Phase 1: [planning & approvals]\n- Phase 2: [implementation]\n- Phase 3: [completion & review]\n- Success metrics]\n\n'
    }
  },
  {
    id: 'team-election',
    name: 'Team Election',
    description: 'Election of a new executive team (min. 2 directors)',
    fields: {
      title: '# [Team Election Proposal Title]\n\n',
      description: '## Proposed Team\n\n[List all proposed team members and their roles. Must include at least 2 directors who will become fiduciary managers in Enseada Sonhadora LDA.]\n\n### Directors\n- [Name] — [qualifications & background]\n- [Name] — [qualifications & background]\n\n### Other Team Members\n- [Name] — [role]\n\n',
      rationale: '## Rationale\n\n[Why this team composition? What experience and skills do they bring? How does this serve the community\'s goals?]\n\n',
      impact: '## Term & Mandate\n\n[Proposed term length (6–12 months). Outline the team\'s mandate and key priorities for this term.]\n\n',
      requestedResources: '## Operational Budget\n\n[Budget request for the team\'s term:\n- Team compensation\n- Operational costs\n- Project budgets]\n\n',
      executionPlan: '## Transition Plan\n\n[How will the transition happen?\n- Handover timeline\n- Key responsibilities transfer\n- First 30-day priorities]\n\n'
    }
  },
  {
    id: 'game-guide',
    name: 'Game Guide / Core Documents',
    description: 'Changes to Game Guide, tokenomics, or other core documents',
    fields: {
      title: '# [Document Change Title]\n\n',
      description: '## Proposed Change\n\n[Describe the specific changes to the Game Guide, tokenomics, or other core documents. Include the exact text or sections to be modified.]\n\n',
      rationale: '## Rationale\n\n[Why is this change necessary? What problem does the current text create or what improvement does this bring?]\n\n',
      impact: '## Impact Assessment\n\n[How will this change affect governance, token economy, community rules, or stakeholder rights? List any cascading effects.]\n\n',
      requestedResources: '## Resources Required\n\n[What is needed to implement this change:\n- Documentation updates\n- Communication to community\n- Technical changes (if tokenomics)]\n\n',
      executionPlan: '## Implementation Plan\n\n[How and when will the change take effect:\n- Community notification\n- Effective date\n- Review period]\n\n'
    }
  },
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
