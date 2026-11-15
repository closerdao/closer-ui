import { Building2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useTdfFallback } from '../../hooks/useTdfFallback';
import { resolveBlockText } from '../../utils/blockI18n';
import { renderLinkedText } from '../../utils/simpleFormattedText';
import { Heading } from '../ui';

interface DepartmentMember {
  name: string;
  role: string;
  isOpen?: boolean;
}

interface Department {
  title: string;
  subtitle?: string;
  description?: string;
  members?: DepartmentMember[];
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    departments?: Department[];
  };
}

const CustomTeamDepartments = ({ content }: Props) => {
  const t = useTranslations();
  const { isTdf, tdf } = useTdfFallback();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, tdf('team_operations_label'));
  const title = pick(content?.title, tdf('team_ground_teams_title'));
  const description = pick(content?.description, tdf('team_ground_teams_desc'));

  const defaultDepartments: Department[] = [
    {
      title: tdf('team_hospitality_team_title'),
      subtitle: tdf('team_hospitality_team_when'),
      description: tdf('team_hospitality_team_desc'),
      members: [
        {
          name: tdf('team_luna_name'),
          role: tdf('team_luna_role'),
        },
        {
          name: tdf('team_kitchen_lead'),
          role: tdf('team_position_open'),
          isOpen: true,
        },
        {
          name: tdf('team_kitchen_support'),
          role: tdf('team_position_open'),
          isOpen: true,
        },
        {
          name: tdf('team_housekeeping'),
          role: tdf('team_housekeeping_positions'),
          isOpen: true,
        },
        {
          name: tdf('team_maintenance'),
          role: tdf('team_maintenance_position'),
          isOpen: true,
        },
      ],
    },
    {
      title: tdf('team_ecology_food_title'),
      description: tdf('team_ecology_food_desc'),
      members: [
        {
          name: tdf('team_ofer_name'),
          role: tdf('team_land_steward'),
        },
        {
          name: tdf('team_joao_name'),
          role: tdf('team_land_steward'),
        },
        {
          name: tdf('team_land_steward'),
          role: tdf('team_land_steward_additional'),
          isOpen: true,
        },
        {
          name: tdf('team_volunteers'),
          role: tdf('team_volunteers_positions'),
          isOpen: true,
        },
      ],
    },
    {
      title: tdf('team_build_team_title'),
      description: tdf('team_build_team_desc'),
      members: [
        {
          name: tdf('team_julia_name'),
          role: tdf('team_carpentry'),
        },
      ],
    },
    {
      title: tdf('team_mushroom_farm_title'),
      description: tdf('team_mushroom_farm_desc'),
      members: [
        {
          name: tdf('team_richard_name'),
          role: tdf('team_richard_role'),
        },
        {
          name: tdf('team_tonya_name'),
          role: tdf('team_tonya_role'),
        },
        {
          name: tdf('team_mycology_assistants'),
          role: tdf('team_mycology_assistants_positions'),
          isOpen: true,
        },
      ],
    },
  ];

  const rawDepartments = content?.departments;
  const departments =
    Array.isArray(rawDepartments) && rawDepartments.length > 0
      ? rawDepartments.map((dept) => ({
          title: pick(dept.title, dept.title),
          subtitle: dept.subtitle?.trim()
            ? resolveBlockText(dept.subtitle, t)
            : undefined,
          description: dept.description?.trim()
            ? resolveBlockText(dept.description, t)
            : undefined,
          members: (dept.members ?? []).map((member) => ({
            name: pick(member.name, member.name),
            role: pick(member.role, member.role),
            isOpen: member.isOpen,
          })),
        }))
      : isTdf
        ? defaultDepartments
        : [];

  if (departments.length === 0) return null;

  return (
    <section className="py-16 px-6 bg-accent/20">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <span className="bg-white text-gray-800 text-sm px-4 py-1 rounded-full font-medium self-start">
              {eyebrow}
            </span>
          ) : null}
          {title ? (
            <Heading level={2} className="font-serif text-3xl text-gray-900">
              {title}
            </Heading>
          ) : null}
          {description ? (
            <p className="text-gray-600">{renderLinkedText(description)}</p>
          ) : null}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {departments.map((dept, index) => (
            <div
              key={`${dept.title}-${index}`}
              className="bg-white rounded-2xl p-8 shadow-sm flex flex-col gap-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-800" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {dept.title}
                  </h3>
                  {dept.subtitle ? (
                    <p className="text-sm text-gray-500">{dept.subtitle}</p>
                  ) : null}
                </div>
              </div>
              {dept.description ? (
                <p className="text-sm text-gray-600">
                  {renderLinkedText(dept.description)}
                </p>
              ) : null}
              {dept.members && dept.members.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {dept.members.map((member, memberIndex) => (
                    <div
                      key={`${member.name}-${memberIndex}`}
                      className="flex items-center gap-4"
                    >
                      <div
                        className={`rounded-full flex items-center justify-center ${
                          member.isOpen
                            ? 'w-10 h-10 bg-gray-100'
                            : 'w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100'
                        }`}
                      >
                        <User
                          className={`w-5 h-5 ${
                            member.isOpen ? 'text-gray-500' : 'text-amber-600'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p
                          className={`font-medium ${
                            member.isOpen ? 'text-gray-700' : 'text-gray-900'
                          }`}
                        >
                          {member.name}
                        </p>
                        <p
                          className={`text-sm ${
                            member.isOpen ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {member.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomTeamDepartments;
