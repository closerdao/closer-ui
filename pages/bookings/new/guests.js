import { useRouter } from 'next/router';

import { useState } from 'react';

import { Counter } from '../../../components/Counter';
import Layout from '../../../components/Layout';
import { Progress } from '../../../components/Progress';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
import { __ } from '../../../utils/helpers';

const GuestSelector = () => {
  const { steps } = useBookingState();
  const { pathname } = useRouter();
  const currentStep = steps.find((step) => step.path === pathname);
  const savedData = currentStep.data;
  const currentStepIndex = steps.indexOf(currentStep);
  const { saveStepData, goToNextStep } = useBookingActions();
  const [adults, setAdults] = useState(savedData.adults || 1);
  const [children, setChildren] = useState(savedData.children || 0);
  const [infants, setInfants] = useState(savedData.infants || 0);
  const [pets, setPets] = useState(savedData.pets || 0);

  const handleNext = () => {
    saveStepData({
      adults,
      children,
      infants,
      pets,
      totalGuests: adults,
    });
    goToNextStep();
  };

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto p-8">
        <h1 className="font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center">
          <span className="mr-1">👨‍👩‍👦</span>
          <span>{__('bookings_guest_step_title')}</span>
        </h1>
        <Progress progress={currentStepIndex + 1} total={steps.length} />
        <div className="my-16">
          <div className="flex space-between items-center">
            <p className="flex-1">{__('bookings_guest_step_adults')}</p>
            <Counter value={adults} setFn={setAdults} minValue={1} />
          </div>
          <div className="flex space-between items-center mt-9">
            <p className="flex-1">{__('bookings_guest_step_children')}</p>
            <Counter value={children} setFn={setChildren} minValue={0} />
          </div>
          <div className="flex space-between items-center mt-9">
            <p className="flex-1">{__('bookings_guest_step_infants')}</p>
            <Counter value={infants} setFn={setInfants} minValue={0} />
          </div>
          <div className="flex space-between items-center mt-9">
            <p className="flex-1">{__('bookings_guest_step_pets')}</p>
            <Counter value={pets} setFn={setPets} minValue={0} />
          </div>
        </div>
        <button className="w-full btn uppercase" onClick={handleNext}>
          {__('buttons_select')}
        </button>
      </div>
    </Layout>
  );
};

export default GuestSelector;
