import {
  BLOCK_INSPECTOR_CONFIGS,
} from '../../components/PageEditor/inspectors/blockInspectorConfigs';
import { blockTypeLabelKey } from '../../components/PageEditor/blockLabels';
import { createSection } from '../../components/PageEditor/blockDefaults';
import en from '../../locales/base-en.json';
import pt from '../../locales/base-pt.json';
import { isDynamicBlockType } from '../dynamicBlockTypes';
import { userRolesCanManageProjects } from '../projectAccess';
import {
  buildDefaultStandardPageDoc,
  editorHrefForPage,
  getStandardPageDefinition,
  isStandardPageFeatureEnabled,
  resolveEditorRouteParam,
} from '../standardPages';

const messages = en as Record<string, string>;

describe('/projects standard page', () => {
  it('is registered as a standard page behind the volunteering feature', () => {
    const def = getStandardPageDefinition('/projects');
    expect(def).not.toBeNull();
    expect(def?.key).toBe('projects');
    expect(def?.feature).toBe('volunteering');
    expect(messages[def?.titleKey as string]).toBeDefined();
  });

  it('is gated by the volunteering feature flag and config', () => {
    const previous = process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING;
    process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING = 'true';
    expect(
      isStandardPageFeatureEnabled('volunteering', {
        volunteering: { enabled: true },
      }),
    ).toBe(true);
    expect(
      isStandardPageFeatureEnabled('volunteering', {
        volunteering: { enabled: false },
      }),
    ).toBe(false);
    process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING = previous;
  });

  it('routes to its own editor segment', () => {
    const href = editorHrefForPage({ slug: '/projects', isStandard: true });
    expect(href).toBe('/dashboard/pages/projects');
    expect(resolveEditorRouteParam('projects')).toBe('/projects');
  });

  it('ships defaults that render the project list and no general apply CTA', () => {
    const page = buildDefaultStandardPageDoc('/projects');
    expect(page).not.toBeNull();
    const types = (page?.sections ?? []).map((section) => section.type);
    expect(types).toContain('projectList');

    const serialized = JSON.stringify(page);
    expect(serialized).not.toContain('/projects/apply');
  });
});

describe('projectList block', () => {
  it('is a dynamic block with a label and picker copy in both locales', () => {
    expect(isDynamicBlockType('projectList')).toBe(true);
    expect(blockTypeLabelKey('projectList')).toBe(
      'pages_editor_block_project_list',
    );
    for (const dictionary of [en, pt] as Record<string, string>[]) {
      expect(dictionary['pages_editor_block_project_list']).toBeDefined();
      expect(dictionary['pages_editor_block_project_list_desc']).toBeDefined();
    }
  });

  it('has defaults and an inspector whose labels all exist', () => {
    const block = createSection('projectList');
    expect(block.type).toBe('projectList');

    const config = BLOCK_INSPECTOR_CONFIGS.projectList;
    expect(config).toBeDefined();
    const labelKeys = [
      ...(config?.fields ?? []).map((field) => field.labelKey),
      ...(config?.settingsFields ?? []).map((field) => field.labelKey),
    ];
    expect(labelKeys.length).toBeGreaterThan(0);
    labelKeys.forEach((key) => expect(messages[key]).toBeDefined());
  });

  it('offers Add project to the roles that run the build', () => {
    ['steward', 'space-host', 'team', 'admin'].forEach((role) => {
      expect(userRolesCanManageProjects([role])).toBe(true);
      expect(userRolesCanManageProjects(['member', role])).toBe(true);
    });
  });

  it('hides Add project from everyone else', () => {
    expect(userRolesCanManageProjects(['member'])).toBe(false);
    expect(userRolesCanManageProjects(['land-manager'])).toBe(false);
    expect(userRolesCanManageProjects([])).toBe(false);
    expect(userRolesCanManageProjects(undefined)).toBe(false);
  });

  it('has an Add project label in both locales', () => {
    for (const dictionary of [en, pt] as Record<string, string>[]) {
      expect(dictionary['projects_add_project']).toBeDefined();
    }
  });
});
