import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../../utils/blockI18n';
import { Heading } from '../ui';
import FeatureBlockIcon from './FeatureBlockIcon';

export type FlowNodeStyle = 'default' | 'dashed' | 'dark' | 'accent';

export interface FlowDiagramNode {
  title?: string;
  subtitle?: string;
  /** Label rendered on the connector drawn above this node. */
  connectorLabel?: string;
  icon?: string;
  style?: FlowNodeStyle;
}

export interface FlowDiagramContent {
  eyebrow?: string;
  title?: string;
  description?: string;
  nodes?: FlowDiagramNode[];
  note?: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: FlowDiagramContent;
}

const nodeClass = (style: FlowNodeStyle | undefined): string => {
  switch (style) {
    case 'dark':
      return 'bg-gray-900 text-white border border-gray-900 shadow-md';
    case 'accent':
      return 'bg-accent border border-accent-dark shadow-sm';
    case 'dashed':
      return 'bg-white border border-dashed border-emerald-400 shadow-sm';
    default:
      return 'bg-white border border-gray-300 shadow-sm';
  }
};

const iconWrapClass = (style: FlowNodeStyle | undefined): string => {
  switch (style) {
    case 'dark':
      return 'bg-white/20 text-white';
    case 'accent':
      return 'bg-white text-gray-900';
    case 'dashed':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

const subtitleClass = (style: FlowNodeStyle | undefined): string =>
  style === 'dark' ? 'text-gray-300' : 'text-gray-500';

const CustomFlowDiagram = ({ content }: Props) => {
  const t = useTranslations();
  const nodes = Array.isArray(content?.nodes) ? content.nodes : [];

  const eyebrow = resolveBlockText(content?.eyebrow, t);
  const title = resolveBlockText(content?.title, t);
  const description = resolveBlockText(content?.description, t);
  const note = resolveBlockText(content?.note, t);

  if (nodes.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-6">
        {eyebrow || title || description ? (
          <div className="text-center mb-8 flex flex-col gap-3">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <Heading
                level={2}
                className="text-2xl md:text-3xl text-gray-900 font-normal"
              >
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="text-base text-gray-700 leading-relaxed font-light">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-1">
          {nodes.map((node, index) => {
            const connectorLabel = resolveBlockText(node.connectorLabel, t);
            return (
              <div
                key={`${node.title}-${index}`}
                className="w-full flex flex-col items-center"
              >
                {index > 0 ? (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-0.5 h-3 bg-gray-300" />
                    {connectorLabel ? (
                      <span className="text-[10px] text-gray-500 px-1">
                        {connectorLabel}
                      </span>
                    ) : null}
                    <div className="w-0.5 h-3 bg-gray-300" />
                  </div>
                ) : null}
                <div
                  className={`rounded-xl p-3 w-full max-w-[220px] text-center ${nodeClass(
                    node.style,
                  )}`}
                >
                  {node.icon ? (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${iconWrapClass(
                        node.style,
                      )}`}
                    >
                      <FeatureBlockIcon
                        iconId={node.icon}
                        className="w-4 h-4"
                      />
                    </div>
                  ) : null}
                  <h3 className="font-semibold text-sm">
                    {resolveBlockText(node.title, t)}
                  </h3>
                  {node.subtitle ? (
                    <p className={`text-[10px] ${subtitleClass(node.style)}`}>
                      {resolveBlockText(node.subtitle, t)}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {note ? (
          <p className="text-xs text-gray-600 font-light text-center max-w-xl mx-auto mt-6">
            {note}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default CustomFlowDiagram;
