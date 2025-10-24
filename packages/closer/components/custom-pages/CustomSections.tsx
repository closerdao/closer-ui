import { Page } from 'closer/types/customPages';

import CustomSectionComponent from './CustomSectionComponent';

const CustomSections = ({ page }: { page: Page }) => {
  return (
    <div className=" flex flex-col gap-[100px] pb-[40px]">
      {page.sections.map((section, index) => (
        <CustomSectionComponent
          key={index}
          type={section.type}
          data={section.data}
        />
      ))}
    </div>
  );
};

export default CustomSections;
