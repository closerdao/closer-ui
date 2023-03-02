import { CreateBookingDatesPage, api } from 'closer';

export const getStaticProps = async () => {
  try {
    const {
      data: { results },
    } = await api.get('/bookings/settings');
    console.log('results', results);
    return {
      props: {
        settings: results,
      },
    };
  } catch (err) {
    return {
      props: {
        error: (err as Error)?.message,
        settings: null,
      },
    };
  }
};

export default CreateBookingDatesPage;
