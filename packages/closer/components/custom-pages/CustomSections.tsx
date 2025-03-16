import React from 'react';
import CustomSectionComponent from './CustomSectionComponent';
import { Page } from 'closer/types/customPages';

const CustomSections = ({ page }: { page: Page }) => {
    return (
        // <div className="max-w-3xl mx-auto py-10 flex flex-col gap-[120px]">
        <div className="flex flex-col gap-[120px]">
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