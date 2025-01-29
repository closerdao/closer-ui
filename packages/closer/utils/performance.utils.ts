export const getStartAndEndDate = (
  timeFrame: string,
  fromDate: string,
  toDate: string,
) => {
  let startDate: Date;
  let endDate: Date;

  switch (timeFrame) {
    case 'month':
      startDate = new Date(new Date().setDate(new Date().getDate() - 30));
      endDate = new Date();
      break;
    case 'year':
      startDate = new Date(new Date().setDate(new Date().getDate() - 365));
      endDate = new Date();
      break;
    case 'week':
      startDate = new Date(new Date().setDate(new Date().getDate() - 7));
      endDate = new Date();
      break;
    case 'allTime':
      startDate = new Date(0);
      endDate = new Date();
      break;
    case 'today':
      startDate = new Date(new Date().setHours(0, 0, 0, 0));
      endDate = new Date(new Date().setHours(23, 59, 59, 999));
      break;
    case 'custom':
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      break;
    default:
      startDate = new Date(0);
      endDate = new Date();
      break;
  }

  return { startDate, endDate };
};