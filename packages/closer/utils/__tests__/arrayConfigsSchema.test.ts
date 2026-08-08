import { getValidationSchema } from '../../constants/validation.constants';
import { getArrayConfigsSchema } from '../config.utils';

describe('getArrayConfigsSchema', () => {
  it('describes the shape of a populated elements array', () => {
    expect(
      getArrayConfigsSchema([
        {
          value: {
            elements: [
              { name: 'Basic', price: 10 },
              { name: 'Pro', price: 20 },
            ],
          },
        },
      ]),
    ).toEqual([{ len: 2, names: ['name', 'price'] }]);
  });

  it('skips a config whose elements array is empty', () => {
    // `[]` is truthy, so a truthiness filter used to let it through and then
    // read keys off `elements[0]` — undefined — crashing the config page.
    expect(getArrayConfigsSchema([{ value: { elements: [] } }])).toEqual([]);
  });

  it('skips elements arrays holding null or primitive entries', () => {
    expect(
      getArrayConfigsSchema([
        { value: { elements: [null] } },
        { value: { elements: ['legacy-string'] } },
      ]),
    ).toEqual([]);
  });

  it('skips configs with a missing or non-array elements key', () => {
    expect(
      getArrayConfigsSchema([
        { value: {} },
        {},
        { value: { elements: { high: 'season' } } },
      ]),
    ).toEqual([]);
  });

  it('keeps describing later configs when an earlier one is empty', () => {
    expect(
      getArrayConfigsSchema([
        { value: { elements: [] } },
        { value: { elements: [{ title: 'Monthly' }] } },
      ]),
    ).toEqual([{ len: 1, names: ['title'] }]);
  });

  it('produces a schema the config form can build from', () => {
    // buildValidationObject destructures every entry, so an `undefined` in the
    // list would throw before the form ever renders.
    const build = () =>
      getValidationSchema(
        getArrayConfigsSchema([
          { value: { elements: [] } },
          { value: { elements: [{ price: 10 }] } },
        ]),
      );

    expect(build).not.toThrow();
    expect(build()?.safeParse({ price: '10' }).success).toBe(false);
    expect(build()?.shape).toHaveProperty('price-0');
  });
});
