import type { FoodOption } from '../types/food';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

// The legacy `GET /food` results, from whichever API serves food in this build.
export const fetchFoodOptions = async (params?: {
  limit?: number;
}): Promise<FoodOption[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/food', { params });
    return res.data.results;
  }
  const results = await trpc.food.list.query(params).catch(throwApiError);
  return results as FoodOption[];
};

// EditModel load/save/remove over tRPC; `{}` leaves EditModel on its axios calls.
export const foodEditModelBackend = () =>
  isTrpcEnabled()
    ? {
        load: (id: string) =>
          trpc.food.get.query({ search: id }).catch(throwApiError),
        save: (payload: any, id?: string) =>
          (id
            ? trpc.food.update.mutate({ search: id, data: payload })
            : trpc.food.create.mutate(payload)
          ).catch(throwApiError),
        remove: async (id: string) => {
          await trpc.food.remove.mutate({ id }).catch(throwApiError);
        },
      }
    : {};
