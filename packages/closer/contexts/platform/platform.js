import { createContext, useContext, useMemo, useReducer, useRef } from 'react';

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
  'interaction',
  'metric',
  'page',
  'charge',
  'sale',
  'financeapplication',
  'vote',
  'cohousingapplication',
  'engagementopportunity',
];

const filterToKey = (filter) => JSON.stringify(filter) || '__';
const CACHE_DURATION_MS = 5 * 60 * 1000;
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
    case constants.PUT_INIT:
      return state;
    case constants.PATCH_ERROR:
    case constants.PUT_ERROR:
      return state;
    case constants.POST_ERROR:
      return state
        .set([action.model, 'isPosting'], false)
        .set([action.model, 'postError'], action.error);
    case constants.POST_SUCCESS:
      return state.withMutations((map) => {
        map.set([action.model, 'isPosting'], false);
        const hasId = action.id != null && action.id !== '';
        if (hasId) {
          map.mergeIn(
            [action.model, 'byId', action.id],
            Map({
              data: action.results,
              loading: false,
              error: null,
              receivedAt: Date.now(),
            }),
          );
        }

        const byFilterMap = map.getIn([action.model, 'byFilter']);
        if (hasId && byFilterMap) {
          byFilterMap.forEach((filterData, filterKey) => {
            const data = filterData.get('data');
            if (data) {
              try {
                const newItem = action.results;
                const currentFilter = JSON.parse(filterKey);

                let matches = true;

                if (currentFilter.where) {
                  Object.keys(currentFilter.where).forEach((key) => {
                    const filterValue = currentFilter.where[key];
                    const itemValue = newItem.get(key);
                    if (itemValue !== filterValue) {
                      matches = false;
                    }
                  });
                } else if (Object.keys(currentFilter).length === 0) {
                  matches = true;
                } else {
                  matches = false;
                }

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
    case constants.PUT_SUCCESS:
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
  const stateRef = useRef(state);
  stateRef.current = state;
  const platform = useMemo(() => {
    const nextPlatform = {
      toJS: () => stateRef.current.toJS(),
    };
    models.forEach((model) => {
      nextPlatform[model] = {
      // Find data in the state
      find: (filter) =>
        stateRef.current.getIn([model, 'byFilter', filterToKey(filter), 'data']),
      findOne: (id) => stateRef.current.getIn([model, 'byId'].concat(id, 'data')),
      findCount: (filter) =>
        stateRef.current.getIn([model, 'count', filterToKey(filter), 'data']),
      findGraph: (filter) =>
        stateRef.current.getIn([model, 'graph', filterToKey(filter), 'data']),

      isLoading: (id) => stateRef.current.getIn([model, 'byId', id, 'loading']),
      areLoading: (filter) =>
        stateRef.current.getIn([model, 'byFilter', filterToKey(filter), 'loading']),

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
        const useCache =
          !opts.force &&
          stateRef.current.getIn([model, 'byId', id, 'receivedAt']) >
            Date.now() - CACHE_DURATION_MS;
        if (useCache) {
          return new Promise((resolve) =>
            resolve({
              type: constants.GET_ONE_SUCCESS,
              fromCache: true,
              results: stateRef.current.getIn([model, 'byId', id]),
            }),
          );
        }
        return (
          api
            .get(`/${model}/${id}`, {
              ...(opts.force ? { cache: false } : {}),
            })
            .then((res) => {
              const results = fromJS(res.data.results);
              if (opts.fetchLinkedObjects && results.count()) {
                nextPlatform.user.get({
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
      get: (filter, opts = {}) => {
        const defaultOptions = { sort_by: '-created' };
        if (model === 'config' && !filter?.limit) {
          defaultOptions.limit = 100;
        }
        const options = Object.assign(defaultOptions, filter);
        const filterKey = filterToKey(filter);
        const useCache =
          !opts.force &&
          stateRef.current.getIn([model, 'byFilter', filterKey, 'receivedAt']) >
            Date.now() - CACHE_DURATION_MS;
        if (useCache) {
          return new Promise((resolve) =>
            resolve({
              filterKey,
              type: constants.GET_SUCCESS,
              fromCache: true,
              receivedAt: stateRef.current.getIn([
                model,
                'byFilter',
                filterKey,
                'receivedAt',
              ]),
              results: stateRef.current.getIn([model, 'byFilter', filterKey, 'data']),
            }),
          );
        }

        dispatch({ type: constants.GET_INIT, model, filterKey });
        return api
          .get(`/${model}`, {
            params: {
              ...options,
              where: options.where && formatSearch(options.where),
            },
            ...(opts.force ? { cache: false } : {}),
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
          stateRef.current.getIn([model, 'count', filterKey, 'receivedAt']) >
          Date.now() - CACHE_DURATION_MS
        ) {
          return new Promise((resolve) =>
            resolve({
              type: constants.GET_COUNT_SUCCESS,
              fromCache: true,
              results: stateRef.current.getIn([model, 'count', filterKey, 'data']),
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
          stateRef.current.getIn([model, 'graph', filterKey, 'receivedAt']) >
          Date.now() - CACHE_DURATION_MS
        ) {
          return new Promise((resolve) =>
            resolve({
              type: constants.GET_GRAPH_SUCCESS,
              fromCache: true,
              results: stateRef.current.getIn([model, 'graph', filterKey, 'data']),
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
      put: (_id, data) => {
        dispatch({ type: constants.PUT_INIT, model, _id, data });
        return api
          .put(`/${model}/${_id}`, data)
          .then((res) => {
            const results = fromJS(res.data.results);
            const action = {
              results,
              _id,
              data,
              model,
              type: constants.PUT_SUCCESS,
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
              type: constants.PUT_ERROR,
            }),
          );
      },
    };
    });

    nextPlatform.page.generate = (data) => {
      const filterKey = filterToKey(data);
      dispatch({ type: constants.POST_INIT, model: 'page', filterKey });
      return api
        .post('/pages/generate', data)
        .then((res) => {
          const results = fromJS(res.data.results);
          const action = {
            results,
            id: results.get('_id'),
            filterKey,
            model: 'page',
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
            model: 'page',
            type: constants.POST_ERROR,
          }),
        );
    };

    nextPlatform.engagementopportunity.fetchList = (filter, _opts = {}) => {
      const defaultOptions = { sort_by: '-score' };
      const options = Object.assign(defaultOptions, filter);
      const filterKey = filterToKey(filter);
      dispatch({
        type: constants.GET_INIT,
        model: 'engagementopportunity',
        filterKey,
      });
      return api
        .get('/engagementopportunity', {
          params: {
            ...options,
            where: options.where && formatSearch(options.where),
          },
          cache: false,
        })
        .then((res) => {
          const results = fromJS(res.data.results);
          const total =
            typeof res.data.total === 'number'
              ? res.data.total
              : typeof res.data.count === 'number'
                ? res.data.count
                : results.size;
          const action = {
            results,
            receivedAt: Date.now(),
            filterKey,
            model: 'engagementopportunity',
            type: constants.GET_SUCCESS,
            total,
          };
          dispatch(action);
          return action;
        })
        .catch((error) =>
          dispatch({
            error,
            filterKey,
            model: 'engagementopportunity',
            type: constants.GET_ERROR,
          }),
        );
    };

    nextPlatform.engagementopportunity.approve = (_id, data = {}) =>
      api
        .post(
          `/engagementopportunity/${encodeURIComponent(_id)}/approve`,
          data,
        )
        .then((res) => {
        const results = fromJS(res.data.results);
        dispatch({
          type: constants.PATCH_SUCCESS,
          results,
          _id,
          model: 'engagementopportunity',
          data,
        });
        return res;
      });

    nextPlatform.engagementopportunity.dismiss = (_id, data = {}) =>
      api
        .post(
          `/engagementopportunity/${encodeURIComponent(_id)}/dismiss`,
          data,
        )
        .then((res) => {
        const results = fromJS(res.data.results);
        dispatch({
          type: constants.PATCH_SUCCESS,
          results,
          _id,
          model: 'engagementopportunity',
          data,
        });
        return res;
      });

    nextPlatform.engagementopportunity.sampleEmail = (data = {}) =>
      api
        .post('/engagement-opportunities/sample-email', data)
        .then((res) => res.data);

    nextPlatform.engagementopportunity.appendHistory = (_id, data = {}) =>
      api
        .post(
          `/engagement-opportunities/${encodeURIComponent(_id)}/history`,
          data,
        )
        .then((res) => res.data);

    nextPlatform.cohousingapplication.getMine = () =>
      api.get('/my/CohousingApplication').then((res) => res.data);

    nextPlatform.CohousingApplication = nextPlatform.cohousingapplication;

    nextPlatform.cohousingapplication.create = (data) =>
      api.post('/CohousingApplication', data).then((res) => res.data);

    nextPlatform.bookings = {
    complete: (_id) =>
      api.post(`/bookings/${_id}/complete`, {}).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id,
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return res;
      }),
    creditPayment: (_id, data) =>
      api.post(`/bookings/${_id}/credit-payment`, data).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id,
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return res;
      }),
    payment: (data) => api.post('/bookings/payment', data),
    updateFood: (_id, data) =>
      api.post(`/bookings/${_id}/update-food`, data).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id,
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return res;
      }),
    updatePayment: (_id, data) =>
      api.post(`/bookings/${_id}/update-payment`, data).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id,
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return res;
      }),
    update: (_id, data) =>
      api
        .post('/bookings/update', {
          ...data,
          bookingId: _id,
        })
        .then((res) => {
          const results = fromJS(res.data.results);
          const action = {
            results,
            _id,
            model: 'booking',
            type: constants.PATCH_SUCCESS,
          };
          dispatch(action);
          return res;
        }),
    paymentConfirmation: (data) =>
      api.post('/bookings/payment/confirmation', data).then((res) => {
        const results = fromJS(res.data.results);
        const action = {
          results,
          _id: results.get('_id'),
          model: 'booking',
          type: constants.PATCH_SUCCESS,
        };
        dispatch(action);
        return res;
      }),
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

    nextPlatform.stays = {
      approveExtension: (_id) =>
        api
          .post(`/stays/${encodeURIComponent(_id)}/extension/approve`, {})
          .then((res) => {
            const results = fromJS(res.data.results);
            dispatch({
              type: constants.PATCH_SUCCESS,
              results,
              _id,
              model: 'stay',
              data: {},
            });
            return res;
          }),
      rejectExtension: (_id) =>
        api
          .post(`/stays/${encodeURIComponent(_id)}/extension/reject`, {})
          .then((res) => {
            const results = fromJS(res.data.results);
            dispatch({
              type: constants.PATCH_SUCCESS,
              results,
              _id,
              model: 'stay',
              data: {},
            });
            return res;
          }),
    };

    nextPlatform.carrots = {
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
      return stateRef.current.getIn(['balance', filterKey, 'data']);
    },
  };

    nextPlatform.metrics = {
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
      return stateRef.current.getIn(['tokenSales', filterKey, 'data']);
    },
  };
    return nextPlatform;
  }, []);
  const contextValue = useMemo(() => ({ platform }), [platform, state]);

  return (
    <PlatformContext.Provider value={contextValue}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => useContext(PlatformContext);
