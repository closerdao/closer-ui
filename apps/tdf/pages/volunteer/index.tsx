import Head from 'next/head';

import React from 'react';

import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { MdLocationOn } from '@react-icons/all-files/md/MdLocationOn';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

const start = dayjs('2023-03-20 10:00');
const end = dayjs('2023-03-25 17:00');
const duration = end && end.diff(start, 'hour', true);
const isThisYear = dayjs().isSame(start, 'year');
const dateFormat = isThisYear ? 'MMMM Do HH:mm' : 'YYYY MMMM Do HH:mm';

const ImpactMapPage = () => {
  return (
    <>
      <Head>
        <title>
          Volunteer | Traditional Dream Factory | Regenerative coliving space in
          Alentejo, Portugal
        </title>
      </Head>
      <section className="mb-8 w-full">
        <h1>Volunteer at TDF</h1>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="card">
          <h2>Helophyte planting</h2>
          <div className="flex flex-row items-center py-3 space-x-1 mt-2 text-gray-500">
            <FaCalendarAlt />
            <p className="text-xs font-light">
              {start && start.format(dateFormat)}
              {end && duration <= 24 && ` - ${end.format('HH:mm')}`}
              {end && duration >= 24 && ` - ${end.format(dateFormat)}`}
            </p>
          </div>
          <div className="flex flex-row items-center py-3 space-x-1 mt-2 text-gray-500">
            <MdLocationOn />
            <p className="text-sm">Traditional Dream Factory, Abela</p>
          </div>

          <div className="flex flex-row items-center">
            <img
              src="https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F9d704a3a-e959-41be-801a-4df006a17133%2FUntitled.png?table=block&id=4348a4f6-ca62-4549-ac3b-2f374a7b2450&spaceId=222dc36e-c5a7-402a-88b4-408a95bc89f8&width=2000&userId=e880b949-26ad-40a3-9a7f-6789bd0ac3a6&cache=v2"
              alt="helophite filter description"
            />
          </div>
          <p className="py-3">
            Come a learn with our partners from{' '}
            <a href="http://smarthoods.nl/" rel="noreferrer" target="_blank">
              Smarthoods
            </a>{' '}
            how to build a Helophyte grey water treatment plant.
          </p>
          <div className="mt-4 py-3">
            <a
              href="mailto:traditionaldreamfactory+volunteer@gmail.com"
              className="btn-primary"
            >
              Apply
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default ImpactMapPage;
