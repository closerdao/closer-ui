import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InfoTooltip, { Tooltip } from './InfoTooltip';

test('hover opens help and moving onto the tooltip keeps it readable', async () => {
  const user = userEvent.setup();
  render(
    <InfoTooltip label="About utilities">Saved nightly average</InfoTooltip>,
  );
  const button = screen.getByRole('button', { name: 'About utilities' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  await user.hover(button);
  const tooltip = screen.getByRole('tooltip');
  expect(button).toHaveAttribute('aria-describedby', tooltip.id);
  // user-event's pointerout omits relatedTarget; supply the browser transition.
  fireEvent(
    button,
    new MouseEvent('pointerout', { bubbles: true, relatedTarget: tooltip }),
  );
  expect(tooltip).toBeVisible();
  fireEvent(
    tooltip,
    new MouseEvent('pointerout', {
      bubbles: true,
      relatedTarget: document.body,
    }),
  );
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('keyboard focus opens help; Escape dismisses it and Tab moves on', async () => {
  const user = userEvent.setup();
  render(
    <>
      <InfoTooltip label="About food">Saved food total</InfoTooltip>
      <button>Next</button>
    </>,
  );
  await user.tab();
  const button = screen.getByRole('button', { name: 'About food' });
  expect(button).toHaveFocus();
  expect(screen.getByRole('tooltip')).toBeVisible();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  expect(button).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('clicks toggle info and tapping outside dismisses it without submitting a form', async () => {
  const submit = jest.fn();
  const user = userEvent.setup();
  render(
    <form onSubmit={submit}>
      <InfoTooltip label="About food">Saved food total</InfoTooltip>
    </form>,
  );
  const button = screen.getByRole('button');
  await user.click(button);
  expect(screen.getByRole('tooltip')).toBeVisible();
  await user.click(button);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.click(button);
  expect(screen.getByRole('tooltip')).toBeVisible();
  fireEvent.pointerDown(document.body, { pointerType: 'touch' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
});

test('an action tooltip preserves the button action and existing description', async () => {
  const action = jest.fn();
  const user = userEvent.setup();
  render(
    <Tooltip content="No wallet signature needed" openOnClick={false}>
      <button onClick={action} aria-describedby="existing">
        Refresh
      </button>
    </Tooltip>,
  );
  const button = screen.getByRole('button');
  await user.hover(button);
  expect(action).not.toHaveBeenCalled();
  expect(button).toHaveAttribute(
    'aria-describedby',
    `existing ${screen.getByRole('tooltip').id}`,
  );
  await user.click(button);
  expect(action).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  expect(button).toHaveAttribute('aria-describedby', 'existing');
});
