import { useRouter } from 'next/router';

import models from '../../models';
import EditModel from '../EditModel';

const CreateVolunteerView = () => {
  const router = useRouter();
  const onSave = (item: any) => {
    router.push('/volunteer');
  };

  return (
    <EditModel
      endpoint={'/volunteer'}
      fields={models.volunteer}
      onSave={onSave}
    />
  );
};

export default CreateVolunteerView;
