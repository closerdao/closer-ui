import { fireEvent, screen } from '@testing-library/react';

import PagesSidebar, { type PageListItem } from '../PagesSidebar';
import { renderWithNextIntl } from '../../../test/utils';

const page = (
  overrides: Partial<PageListItem> & { _id: string },
): PageListItem => ({
  title: overrides._id,
  slug: `/${overrides._id}`,
  menuSection: '',
  menuSectionOrder: 0,
  menuOrder: 0,
  ...overrides,
});

const renderSidebar = (pages: PageListItem[]) => {
  const onMenuChange = jest.fn();
  renderWithNextIntl(
    <PagesSidebar
      pages={pages}
      activeId={pages[0]?._id ?? ''}
      onNewPage={jest.fn()}
      onMenuChange={onMenuChange}
      saveStatus="saved"
      isOpen
      onClose={jest.fn()}
    />,
  );
  return onMenuChange;
};

/** The row wrapper carries the drop handlers; the link inside is the handle. */
const rowFor = (id: string) => {
  const link = screen.getByText(id).closest('a');
  if (!link?.parentElement) throw new Error(`no row for ${id}`);
  return { link, row: link.parentElement };
};

/** jsdom gives every element a zero-sized rect, so place it explicitly. */
const placeRow = (row: HTMLElement, top: number, height = 40) => {
  row.getBoundingClientRect = () =>
    ({ top, height, bottom: top + height, left: 0, right: 0, width: 200 }) as DOMRect;
};

/**
 * jsdom has no DragEvent, so testing-library's fireEvent drops `clientY`.
 * Building the event by hand keeps the pointer position React reads.
 */
const fireDrag = (
  target: Element,
  type: 'dragstart' | 'dragover' | 'drop',
  clientY?: number,
) => {
  const event = Object.assign(
    new Event(type, { bubbles: true, cancelable: true }),
    {
      clientY,
      dataTransfer: { setData: jest.fn(), dropEffect: '', effectAllowed: '' },
    },
  );
  fireEvent(target, event);
};

const dragOnto = (
  fromId: string,
  toId: string,
  edge: 'top' | 'bottom',
) => {
  const from = rowFor(fromId);
  const to = rowFor(toId);
  placeRow(to.row, 100);
  fireDrag(from.link, 'dragstart');
  const clientY = edge === 'top' ? 105 : 135;
  fireDrag(to.row, 'dragover', clientY);
  fireDrag(to.row, 'drop', clientY);
};

describe('PagesSidebar drag and drop', () => {
  it('reorders pages that are not in a section', () => {
    const onMenuChange = renderSidebar([
      page({ _id: 'alpha', menuOrder: 0 }),
      page({ _id: 'beta', menuOrder: 1 }),
      page({ _id: 'gamma', menuOrder: 2 }),
    ]);

    dragOnto('gamma', 'alpha', 'top');

    expect(onMenuChange).toHaveBeenCalledTimes(1);
    expect(
      onMenuChange.mock.calls[0][0].map(
        (u: { _id: string; menuOrder: number }) => [u._id, u.menuOrder],
      ),
    ).toEqual([
      ['gamma', 0],
      ['alpha', 1],
      ['beta', 2],
    ]);
  });

  it('drops a loose page below a page inside a section', () => {
    const onMenuChange = renderSidebar([
      page({ _id: 'team', menuSection: 'About', menuOrder: 0 }),
      page({ _id: 'loose', menuSectionOrder: 1 }),
    ]);

    dragOnto('loose', 'team', 'bottom');

    const updates = onMenuChange.mock.calls[0][0];
    expect(updates).toContainEqual({
      _id: 'loose',
      slug: '/loose',
      menuSection: 'About',
      menuSectionOrder: 0,
      menuOrder: 1,
    });
  });

  it('moves a page into a section when dropped on its header', () => {
    const onMenuChange = renderSidebar([
      page({ _id: 'team', menuSection: 'About', menuOrder: 0 }),
      page({ _id: 'loose', menuSectionOrder: 1 }),
    ]);

    const header = screen.getByText('About');
    const { link } = rowFor('loose');
    fireDrag(link, 'dragstart');
    fireDrag(header, 'dragover');
    fireDrag(header, 'drop');

    const updates = onMenuChange.mock.calls[0][0];
    expect(
      updates.find((u: { _id: string }) => u._id === 'loose'),
    ).toMatchObject({ menuSection: 'About', menuOrder: 1 });
  });

  it('keeps an empty loose list droppable so pages can leave a section', () => {
    const onMenuChange = renderSidebar([
      page({ _id: 'team', menuSection: 'About', menuOrder: 0 }),
      page({ _id: 'press', menuSection: 'About', menuOrder: 1 }),
    ]);

    const dropZone = screen.getByText('Drop pages here');
    const { link } = rowFor('press');
    fireDrag(link, 'dragstart');
    fireDrag(dropZone, 'dragover');
    fireDrag(dropZone, 'drop');

    expect(
      onMenuChange.mock.calls[0][0].find(
        (u: { _id: string }) => u._id === 'press',
      ),
    ).toMatchObject({ menuSection: '', menuOrder: 0 });
  });

  it('renames a section from the hover action and patches its pages', () => {
    const onMenuChange = renderSidebar([
      page({ _id: 'team', menuSection: 'About', menuOrder: 0 }),
      page({ _id: 'press', menuSection: 'About', menuOrder: 1 }),
    ]);

    fireEvent.click(screen.getByLabelText('Rename section'));
    const input = screen.getByDisplayValue('About');
    fireEvent.change(input, { target: { value: 'Our story' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onMenuChange).toHaveBeenCalledTimes(1);
    expect(
      onMenuChange.mock.calls[0][0].map(
        (u: { _id: string; menuSection: string }) => [u._id, u.menuSection],
      ),
    ).toEqual([
      ['team', 'Our story'],
      ['press', 'Our story'],
    ]);
  });

  it('reorders sections by dragging their headers', () => {
    const onMenuChange = renderSidebar([
      page({ _id: 'team', menuSection: 'About', menuSectionOrder: 0 }),
      page({ _id: 'stay', menuSection: 'Visit', menuSectionOrder: 1 }),
    ]);

    const about = screen.getByText('About');
    const visit = screen.getByText('Visit');
    const visitHeader = visit.parentElement as HTMLElement;
    const aboutHeader = about.parentElement as HTMLElement;
    aboutHeader.getBoundingClientRect = () =>
      ({ top: 0, height: 20, bottom: 20, left: 0, right: 0, width: 200 }) as DOMRect;

    fireDrag(visitHeader, 'dragstart');
    fireDrag(aboutHeader, 'dragover', 2);
    fireDrag(aboutHeader, 'drop', 2);

    expect(
      onMenuChange.mock.calls[0][0].map(
        (u: { _id: string; menuSectionOrder: number }) => [
          u._id,
          u.menuSectionOrder,
        ],
      ),
    ).toEqual([
      ['stay', 0],
      ['team', 1],
    ]);
  });
});
