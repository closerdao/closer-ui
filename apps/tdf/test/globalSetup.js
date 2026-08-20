/**
 * Pin the locale for the whole run.
 *
 * Node reads its default locale from the environment at startup, so anything
 * formatted with `toLocaleString(undefined, …)` — which is the right call in a
 * browser, where it follows the visitor — comes out however the developer's
 * machine is set. A number that renders `7.5` here and `7,5` on a Portuguese
 * laptop makes assertions fail for no reason.
 *
 * This runs before jest forks its workers, and they inherit the environment.
 */
module.exports = () => {
  process.env.LC_ALL = 'en_US.UTF-8';
  process.env.LANG = 'en_US.UTF-8';
};
