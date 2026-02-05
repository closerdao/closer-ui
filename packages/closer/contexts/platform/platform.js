import { createContext, useContext, useReducer } from 'react';

import { Map, fromJS } from 'immutable';

import api, { formatSearch } from '../../utils/api';
import * as constants from './platformActions';

const PlatformContext = createContext({});
export const models = [
  'article',
  'application',
  'booking',
  'config',
  'channel',
  'event',
  'ticket',
  'listing',
  'message',
  'product',
  'post',
  'photo',
  'proposal',
  'resource',
  'session',
  'stay',
  'user',
  'volunteer',
  'lesson',
  'food',
  'metric',
  'charge',
  'sale',
  'vote',
];

const filterToKey = (filter) => JSON.stringify(filter) || '__';
const CACHE_DURATION = 300000;
const init = (state) => {
  return state.withMutations((map) => {
    models.forEach((model) => {
      map.set(
        model,
        Map({
          byId: Map(),
          byFilter: Map(),
        }),
      );
    });
  });
};
const initialState = init(Map());

const reducer = (state, action) => {
  switch (action.type) {
    case constants.GET_ONE_INIT:
      return state.setIn([action.model, 'byId', action.id, 'loading'], true);
    case constants.GET_ONE_ERROR:
      return state.mergeIn(
        [action.model, 'byId', action.id],
        Map({
          error: action.error,
          loading: false,
        }),
      );
    case constants.GET_ONE_SUCCESS:
      return state.mergeIn(
        [action.model, 'byId', action.id],
        Map({
          data: action.results,
          loading: false,
          error: null,
          receivedAt: Date.now(),
        }),
      );
    case constants.POST_INIT:
      return state.set([action.model, 'isPosting'], true);
    case constants.PATCH_INIT:
      return state;
    case constants.PATCH_ERROR:
      return state;
    case constants.POST_ERROR:
      return state
        .set([action.model, 'isPosting'], false)
        .set([action.model, 'postError'], action.error);
    case constants.POST_SUCCESS:
      return state.withMutations((map) => {
        map.set([action.model, 'isPosting'], false).mergeIn(
          [action.model, 'byId', action.id],
          Map({
            data: action.results,
            loading: false,
            error: null,
            receivedAt: Date.now(),
          }),
        );

        // Also update all filter caches that match the new item
        const byFilterMap = map.getIn([action.model, 'byFilter']);
        if (byFilterMap) {
          byFilterMap.forEach((filterData, filterKey) => {
            const data = filterData.get('data');
            if (data) {
              try {
                const newItem = action.results;
                const currentFilter = JSON.parse(filterKey);

                // Check if the new item matches this filter
                let matches = true;

                // If filter has a where clause, check all conditions
                if (currentFilter.where) {
                  Object.keys(currentFilter.where).forEach((key) => {
                    const filterValue = currentFilter.where[key];
                    const itemValue = newItem.get(key);
                    if (itemValue !== filterValue) {
                      matches = false;
                    }
                  });
                }
                // If filter is empty (like {} for "all items"), it matches everything
                else if (Object.keys(currentFilter).length === 0) {
                  matches = true;
                }
                // If filter has other properties but no where clause, skip for now
                else {
                  matches = false;
                }

                // If the new item matches this filter, add it to the beginning (newest first)
                if (matches) {
                  map.setIn(
                    [action.model, 'byFilter', filterKey, 'data'],
                    data.unshift(newItem),
                  );
                }
              } catch (e) {
                // Ignore parsing errors for invalid filter keys
              }
            }
          });
        }
      });
    case constants.PATCH_SUCCESS:
      return state.withMutations((map) => {
        if (action.filterKey && action.resultIndex) {
          map.setIn(
            [
              action.model,
              'byFilter',
              action.filterKey,
              'data',
              action.resultIndex,
            ],
            Map({
              data: action.results,
              loading: false,
              error: null,
              receivedAt: Date.now(),
            }),
          );
        }

        map.setIn(
          [action.model, 'byId', action._id],
          Map({
            data: action.results,
            loading: false,
            error: null,
            receivedAt: Date.now(),
          }),
        );

        map
          .getIn([action.model, 'byFilter'])
          .forEach((filterData, filterKey) => {
            const data = filterData.get('data');
            if (data) {
              const updatedIndex = data.findIndex(
                (item) => item.get('_id') === action._id,
              );
              if (updatedIndex !== -1) {
                map.setIn(
                  [action.model, 'byFilter', filterKey, 'data', updatedIndex],
                  action.results,
                );
              }
            }
          });
      });
    case constants.GET_INIT:
      return state.setIn(
        [action.model, 'byFilter', action.filterKey, 'loading'],
        true,
      );
    case constants.GET_ERROR:
      return state.mergeIn(
        [action.model, 'byFilter', action.filterKey],
        Map({
          error: action.error,
          loading: false,
        }),
      );
    case constants.GET_SUCCESS:
      return state.withMutations((map) => {
        map.setIn(
          [action.model, 'byFilter', action.filterKey],
          Map({
            data: action.results,
            loading: false,
            error: null,
            receivedAt: action.receivedAt,
          }),
        );
        if (action.results) {
          action.results.forEach((item) => {
            if (item.get('_id')) {
              map.setIn(
                [action.model, 'byId', item.get('_id')],
                Map({
                  data: item,
                  loading: false,
                  error: null,
                  receivedAt: action.receivedAt,
                }),
              );
            }
          });
        } else {
          console.warn('No results platform:GET_SUCCESS', action);
        }

        return map;
      });
    case constants.GET_COUNT_INIT:
      return state.setIn(
        [action.model, 'count', action.filterKey, 'loading'],
        true,
      );
    case constants.GET_COUNT_ERROR:
      return state.mergeIn(
        [action.model, 'count', action.filterKey],
        Map({
          error: action.error,
          loading: false,
        }),
      );
    case constants.GET_COUNT_SUCCESS:
      return state.setIn(
        [action.model, 'count', action.filterKey],
        Map({
          data: action.results,
          loading: false,
          error: null,
          receivedAt: Date.now(),
        }),
      );
    case constants.GET_GRAPH_INIT:
      return state.setIn(
        [action.model, 'graph', action.filterKey, 'loading'],
        true,
      );
    case constants.GET_GRAPH_ERROR:
      return state.mergeIn(
        [action.model, 'graph', action.filterKey],
        Map({
          error: action.error,
          loading: false,
        }),
      );
    case constants.GET_GRAPH_SUCCESS:
      return state.setIn(
        [action.model, 'graph', action.filterKey],
        Map({
          data: action.results,
          loading: false,
          error: null,
          receivedAt: Date.now(),
        }),
      );
    case constants.GET_BALANCE_SUCCESS:
      return state.setIn(
        ['balance', action.filterKey],
        Map({
          data: action.results,
          loading: false,
          error: null,
          receivedAt: Date.now(),
        }),
      );
    case constants.GET_TOKEN_SALES_SUCCESS:
      return state.setIn(
        ['tokenSales', action.filterKey],
        Map({
          data: action.results,
          loading: false,
          error: null,
          receivedAt: Date.now(),
        }),
      );
    default:
      console.warn('Unknown action type', action.type);
      return null;
  }
};
export const PlatformProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const platform = {
    toJS: () => state.toJS(),
  };
  models.forEach((model) => {
    platform[model] = {
      // Find data in the state
      find: (filter) =>
        state.getIn([model, 'byFilter', filterToKey(filter), 'data']),
      findOne: (id) => state.getIn([model, 'byId'].concat(id, 'data')),
      findCount: (filter) =>
        state.getIn([model, 'count', filterToKey(filter), 'data']),
      findGraph: (filter) =>
        state.getIn([model, 'graph', filterToKey(filter), 'data']),

      isLoading: (id) => state.getIn([model, 'byId', id, 'loading']),
      areLoading: (filter) =>
        state.getIn([model, 'byFilter', filterToKey(filter), 'loading']),

      // Manually store an object in the store
      set: (object) => {
        const results = fromJS(object);
        const action = {
          results,
          receivedAt: Date.now(),
          id: results.get('_id'),
          model,
          type: constants.GET_ONE_SUCCESS,
        };
        dispatch(action);
      },
      // Loaders
      getOne: (id, opts = {}) => {
        dispatch({ type: constants.GET_ONE_INIT, model, id });
        if (
          state.getIn([model, 'byId', id, 'receivedAt']) >
          Date.now() - CACHE_DURATION
        ) {
          return new Promise((resolve) =>
            resolve({
              type: constants.GET_ONE_SUCCESS,
              fromCache: true,
              results: state.getIn([model, 'byId', id]),
            }),
          );
        }
        return (
          api
            .get(`/${model}/${id}`)
            .then((res) => {
              const results = fromJS(res.data.results);
              if (opts.fetchLinkedObjects && results.count()) {
                platform.user.get({
                  _id: {
                    $in: results.map((item) =>
                      model === 'user'
                        ? item.get('_id')
                        : item.get('createdBy'),
                    ),
                  },
                });
              }
              const action = {
                results,
                id,
                model,
                type: constants.GET_ONE_SUCCESS,
              };
              dispatch(action);
              return action;
            })
            // .then(fetchLinkedObjects(api)((Object.assign({ id, model }, opts))))
            .catch((error) =>
              dispatch({
                error,
                id,
                model,
                type: constants.GET_ONE_ERROR,
              }),
            )
        );
      },
      get: (filter) => {
        const defaultOptions = { sort_by: '-created' };
        if (model === 'config' && !filter?.limit) {
          defaultOptions.limit = 100;
        }
        const options = Object.assign(defaultOptions, filter);
        const filterKey = filterToKey(filter);
        if (
          state.getIn([model, 'byFilter', filterKey, 'receivedAt']) >
          Date.now() - CACHE_DURATION
        ) {
          return new Promise((resolve) =>
            resolve({
              filterKey,
              type: constants.GET_SUCCESS,
              fromCache: true,
              receivedAt: state.getIn([
                model,
                'byFilter',
                filterKey,
                'receivedAt',
              ]),
              results: state.getIn([model, 'byFilter', filterKey, 'data']),
            }),
          );
        }

        dispatch({ type: constants.GET_INIT, model, filterKey });
        // ids_loading[model] = ids_loading[model].concat(id);
        return api
          .get(`/${model}`, {
            params: {
              ...options,
              where: options.where && formatSearch(options.where),
            },
          })
          .then((res) => {
            const action = {
              results: fromJS(res.data.results),
              receivedAt: Date.now(),
              filterKey,
              model,
              type: constants.GET_SUCCESS,
            };
            dispatch(action);
            return action;
          })
          .catch((error) =>
            dispatch({
              error,
              filterKey,
              model,
              type: constants.GET_ERROR,
            }),
          );
      },
      getCount: (params) => {
        const filterKey = filterToKey(params);
        // if (params && params.where) {
        //   params.where = formatSearch(params.where);
        // }
        dispatch({ type: constants.GET_COUNT_INIT, model, filterKey });
        if (
          state.getIn([model, 'count', filterKey, 'receivedAt']) >
          Date.now() - CACHE_DURATION
        ) {
          return new Promise((resolve) =>
            resolve({
              type: constants.GET_COUNT_SUCCESS,
              fromCache: true,
              results: state.getIn([model, 'count', filterKey, 'data']),
            }),
          );
        }
        return api
          .get(`/count/${model}`, { params })
          .then((res) => {
            const results = fromJS(res.data.results);
            const action = {
              results,
              filterKey,
              model,
              type: constants.GET_COUNT_SUCCESS,
            };
            dispatch(action);
            return action;
          })
          .catch((error) =>
            dispatch({
              error,
              filterKey,
              model,
              type: constants.GET_COUNT_ERROR,
            }),
          );
      },
      getGraph: (params) => {
        const filterKey = filterToKey(params);
        dispatch({ type: constants.GET_GRAPH_INIT, model, filterKey });
        if (
          state.getIn([model, 'graph', filterKey, 'receivedAt']) >
          Date.now() - CACHE_DURATION
        ) {
          return new Promise((resolve) =>
            resolve({
              type: constants.GET_GRAPH_SUCCESS,
              fromCache: true,
              results: state.getIn([model, 'graph', filterKey, 'data']),
            }),
          );
        }
        return api
          .get(`/graph/${model}`, { params })
          .then((res) => {
            const results = fromJS(res.data.results);
            const action = {
              results,
              filterKey,
              model,
              type: constants.GET_GRAPH_SUCCESS,
            };
            dispatch(action);
            return action;
          })
          .catch((error) =>
            dispatch({
              error,
              filterKey,
              model,
              type: constants.GET_GRAPH_ERROR,
            }),
          );
      },
      post: (data) => {
        const filterKey = filterToKey(data);
        dispatch({ type: constants.POST_INIT, model, filterKey });
        return api
          .post(`/${model}`, data)
          .then((res) => {
            const results = fromJS(res.data.results);
            const action = {
              results,
              id: results.get('_id'),
              filterKey,
              model,
              type: constants.POST_SUCCESS,
            };
            dispatch(action);
            return action;
          })
          .catch((error) =>
            dispatch({
              error,
              data,
              filterKey,
              model,
              type: constants.POST_ERROR,
            }),
          );
      },
      patch: (_id, data) => {
        dispatch({ type: constants.PATCH_INIT, model, _id, data });
        return api
          .patch(`/${model}/${_id}`, data)
          .then((res) => {
            const results = fromJS(res.data.results);
            const action = {
              results,
              _id,
              data,
              model,
              type: constants.PATCH_SUCCESS,
            };
            dispatch(action);
            return action;
          })
          .catch((error) =>
            dispatch({
              error,
              _id,
              data,
              model,
              type: constants.PATCH_ERROR,
            }),
          );
      },
    };
  });

  platform.bookings = {
    confirm: (_id) =>
      api.post(`/bookings/${_id}/confirm`).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id,
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return action;
      }),
    reject: (_id) =>
      api.post(`/bookings/${_id}/reject`).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id,
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return action;
      }),
    checkIn: (_id) =>
      api.post(`/bookings/${_id}/check-in`).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id,
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return action;
      }),
    checkOut: (_id) =>
      api.post(`/bookings/${_id}/check-out`).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id,
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return action;
      }),
  };

  platform.carrots = {
    getBalance: () =>
      api.get('/carrots/balance').then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          filterKey: 'carrots',
          results,
          type: constants.GET_BALANCE_SUCCESS,
        };
        dispatch(action);
        return action;
      }),

    findBalance: (filterKey) => {
      return state.getIn(['balance', filterKey, 'data']);
    },
  };

  platform.metrics = {
    getTokenSales: () =>
      api.get('/metrics/token-sales').then((res) => {
        const results = fromJS(res.data.results);

        const action = {
          filterKey: 'metrics',
          results,
          type: constants.GET_TOKEN_SALES_SUCCESS,
        };
        dispatch(action);
        return action;
      }),

    findTokenSales: (filterKey) => {
      return state.getIn(['tokenSales', filterKey, 'data']);
    },
  };

  return (
    <PlatformContext.Provider value={{ platform }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => useContext(PlatformContext);
