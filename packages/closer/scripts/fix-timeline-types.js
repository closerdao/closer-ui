const fs = require('fs');
const path = require('path');

const typeDefinitionPath = path.join(__dirname, '../node_modules/@types/react-calendar-timeline/index.d.ts');

try {
  let content = fs.readFileSync(typeDefinitionPath, 'utf8');
  
  // Check if the fix has already been applied with the correct format
  if (content.includes('export default class ReactCalendarTimeline<')) {
    console.log('✅ React 18 compatibility fix already applied to react-calendar-timeline types');
    return;
  }
  

  
  // Apply the React 18 compatibility fix
  const oldClassDefinition = `export default class ReactCalendarTimeline<
        CustomItem extends TimelineItemBase<any> = TimelineItemBase<number>,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    > extends React.Component<ReactCalendarTimelineProps<CustomItem, CustomGroup>> {}`;
  
  const oldFunctionDefinition = `declare const ReactCalendarTimeline: <
        CustomItem extends TimelineItemBase<any> = TimelineItemBase<number>,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    >(props: ReactCalendarTimelineProps<CustomItem, CustomGroup>) => React.ReactElement;
    export default ReactCalendarTimeline;`;
  
  const newFunctionDefinition = `export default class ReactCalendarTimeline<
        CustomItem extends TimelineItemBase<any> = TimelineItemBase<number>,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    > extends React.Component<ReactCalendarTimelineProps<CustomItem, CustomGroup>> {}`;
  
  if (content.includes(oldClassDefinition)) {
    content = content.replace(oldClassDefinition, newFunctionDefinition);
    fs.writeFileSync(typeDefinitionPath, content, 'utf8');
    console.log('✅ Applied React 18 compatibility fix to react-calendar-timeline types');
  } else if (content.includes(oldFunctionDefinition)) {
    content = content.replace(oldFunctionDefinition, newFunctionDefinition);
    fs.writeFileSync(typeDefinitionPath, content, 'utf8');
    console.log('✅ Updated React 18 compatibility fix to react-calendar-timeline types');
  } else {
    console.log('⚠️  Could not find the expected definition to replace');
  }
} catch (error) {
  console.error('❌ Error applying React 18 compatibility fix:', error.message);
  process.exit(1);
} 