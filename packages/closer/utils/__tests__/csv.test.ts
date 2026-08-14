import { getBookingAnswers } from '../booking.helpers';
import { csvCell } from '../csv';

describe('csvCell', () => {
  it('quotes empty and missing values', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
    expect(csvCell('')).toBe('""');
  });

  it('quotes plain text and numbers', () => {
    expect(csvCell('to rest')).toBe('"to rest"');
    expect(csvCell(12)).toBe('"12"');
  });

  it('escapes embedded double quotes', () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('neutralizes spreadsheet formula prefixes', () => {
    expect(csvCell('=HYPERLINK("http://evil.example","x")')).toBe(
      `"'=HYPERLINK(""http://evil.example"",""x"")"`,
    );
    expect(csvCell("+cmd|' /C calc'!A0")).toBe(`"'+cmd|' /C calc'!A0"`);
    expect(csvCell("-2+3+cmd|' /C calc'!A0")).toBe(
      `"'-2+3+cmd|' /C calc'!A0"`,
    );
    expect(csvCell('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
  });

  it('neutralizes tab, CR, and leading whitespace before a formula', () => {
    expect(csvCell('\t=cmd')).toBe(`"'\t=cmd"`);
    expect(csvCell('\r=cmd')).toBe(`"'\r=cmd"`);
    expect(csvCell(' =HYPERLINK("http://evil.example")')).toBe(
      `"' =HYPERLINK(""http://evil.example"")"`,
    );
  });

  it('does not prefix ordinary questionnaire text that is not a formula', () => {
    expect(csvCell('Dietary needs: vegan')).toBe('"Dietary needs: vegan"');
    expect(csvCell('Why are you coming?: to rest | Diet: vegan')).toBe(
      '"Why are you coming?: to rest | Diet: vegan"',
    );
  });

  it('neutralizes a formula injected as a questionnaire field key', () => {
    const questionnaire = getBookingAnswers([
      { '=HYPERLINK("http://evil.example","Click")': 'yes' },
    ])
      .map(({ question, answer }) => `${question}: ${answer}`)
      .join(' | ');

    expect(csvCell(questionnaire)).toBe(
      `"'=HYPERLINK(""http://evil.example"",""Click""): yes"`,
    );
  });
});
