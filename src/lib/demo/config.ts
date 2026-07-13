/** Central switch for every demo-only route/behavior. Demo routes must 404
 * when this is false — never silently no-op, so it's obvious in dev/prod
 * whether Demo Mode is actually active. */
export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE === 'true';
}
